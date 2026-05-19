#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_DIR="${VENV_DIR:-.venv}"
LOCAL_API_PORT="${LOCAL_API_PORT:-4010}"
LOCAL_WEB_PORT="${LOCAL_WEB_PORT:-4173}"
DEPLOY_TIMEOUT_SECONDS="${DEPLOY_TIMEOUT_SECONDS:-600}"
DEPLOY_POLL_SECONDS="${DEPLOY_POLL_SECONDS:-10}"
PROD_API_HEALTH_URL="${PROD_API_HEALTH_URL:-https://api-lemon-psi-31.vercel.app/health}"
PROD_WEB_URL="${PROD_WEB_URL:-https://web-two-beta-72.vercel.app/}"
SKIP_PULL="${SKIP_PULL:-0}"
SKIP_DOCKER="${SKIP_DOCKER:-0}"
SKIP_DEPLOY="${SKIP_DEPLOY:-0}"
ALLOW_DIRTY="${ALLOW_DIRTY:-0}"
LOG_DIR="${LOG_DIR:-.pipeline-logs}"

mkdir -p "$LOG_DIR"

API_PID=""
WEB_PID=""

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

fail() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  if [[ -n "${API_PID}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
  if [[ -n "${WEB_PID}" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

need_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local deadline=$((SECONDS + DEPLOY_TIMEOUT_SECONDS))

  until curl -fsS "$url" >/dev/null; do
    if (( SECONDS >= deadline )); then
      fail "Timed out waiting for ${label}: ${url}"
    fi
    sleep "$DEPLOY_POLL_SECONDS"
  done

  log "Verified ${label}: ${url}"
}

ensure_clean_tree() {
  if [[ "$ALLOW_DIRTY" == "1" ]]; then
    log "ALLOW_DIRTY=1 set; skipping clean worktree check"
    return
  fi

  git diff --quiet || fail "Worktree has unstaged changes. Commit/stash them or set ALLOW_DIRTY=1."
  git diff --cached --quiet || fail "Worktree has staged changes. Commit/stash them or set ALLOW_DIRTY=1."
}

pull_latest_main() {
  if [[ "$SKIP_PULL" == "1" ]]; then
    log "SKIP_PULL=1 set; not pulling latest ${REMOTE}/${BRANCH}"
    return
  fi

  ensure_clean_tree
  local current_branch
  current_branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$current_branch" != "$BRANCH" ]]; then
    log "Checking out ${BRANCH}"
    git checkout "$BRANCH"
  fi

  log "Pulling latest code from ${REMOTE}/${BRANCH}"
  git fetch "$REMOTE" "$BRANCH"
  git pull --ff-only "$REMOTE" "$BRANCH"
}

install_dependencies() {
  need_command git
  need_command curl
  need_command npm
  need_command "$PYTHON_BIN"

  log "Installing backend dependencies"
  if [[ ! -x "${VENV_DIR}/bin/python" ]]; then
    "$PYTHON_BIN" -m venv "$VENV_DIR"
  fi
  "${VENV_DIR}/bin/python" -m pip install --upgrade pip >/dev/null
  "${VENV_DIR}/bin/python" -m pip install -r apps/api/requirements.txt

  log "Installing frontend dependencies"
  npm ci
}

run_static_analysis() {
  log "Running backend static analysis"
  "${VENV_DIR}/bin/python" -m ruff check apps/api/src apps/api/tests
  "${VENV_DIR}/bin/python" -m ruff format --check apps/api/src apps/api/tests
  "${VENV_DIR}/bin/python" -m pyright --pythonpath "${VENV_DIR}/bin/python" apps/api/src
  "${VENV_DIR}/bin/python" -m bandit -r apps/api/src -q

  log "Running frontend static analysis"
  npm --workspace apps/web run lint
  npm --workspace apps/web run typecheck
  npm --workspace apps/web run format:check
  npm --workspace apps/web audit --audit-level=high
}

run_tests() {
  log "Running backend unit/integration tests"
  "${VENV_DIR}/bin/python" -m pytest apps/api/tests -q

  log "Running frontend unit tests"
  npm --workspace apps/web test
}

run_local_smoke_tests() {
  log "Running local API smoke test"
  (
    cd apps/api
    "../../${VENV_DIR}/bin/python" -m uvicorn src.main:app \
      --host 127.0.0.1 \
      --port "$LOCAL_API_PORT" \
      > "../../${LOG_DIR}/api-smoke.log" 2>&1
  ) &
  API_PID=$!
  wait_for_url "http://127.0.0.1:${LOCAL_API_PORT}/health" "local API health"

  log "Building frontend for smoke test"
  npm --workspace apps/web run build

  log "Running local web smoke test"
  npm --workspace apps/web run preview -- --host 127.0.0.1 --port "$LOCAL_WEB_PORT" \
    > "${LOG_DIR}/web-smoke.log" 2>&1 &
  WEB_PID=$!
  wait_for_url "http://127.0.0.1:${LOCAL_WEB_PORT}/login" "local web preview"
}

build_deployable_images() {
  if [[ "$SKIP_DOCKER" == "1" ]]; then
    log "SKIP_DOCKER=1 set; not building Docker images"
    return
  fi

  need_command docker
  local git_sha
  git_sha="$(git rev-parse --short HEAD)"

  log "Packaging backend Docker image blowtorch-api:${git_sha}"
  docker build -f apps/api/Dockerfile -t "blowtorch-api:${git_sha}" .

  log "Packaging frontend Docker image blowtorch-web:${git_sha}"
  docker build -f apps/web/Dockerfile -t "blowtorch-web:${git_sha}" .
}

trigger_deploy_hook() {
  local hook_url="$1"
  local label="$2"

  [[ -n "$hook_url" ]] || fail "Missing deploy hook URL for ${label}"

  log "Triggering ${label} production deploy hook"
  curl -fsS -X POST "$hook_url" > "${LOG_DIR}/${label}-deploy-hook.json"
}

wait_for_vercel_ready() {
  local project_id="$1"
  local label="$2"
  local since_ms="$3"

  if [[ -z "${VERCEL_TOKEN:-}" || -z "$project_id" ]]; then
    log "Skipping Vercel API deployment-status polling for ${label}; token/project id not set"
    return
  fi

  local query="projectId=${project_id}&target=production&limit=1"
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    query="${query}&teamId=${VERCEL_TEAM_ID}"
  fi

  local deadline=$((SECONDS + DEPLOY_TIMEOUT_SECONDS))
  while true; do
    local body parsed state created dep_url
    body="$(curl -fsS -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      "https://api.vercel.com/v6/deployments?${query}")"
    parsed="$("${VENV_DIR}/bin/python" -c 'import json,sys; data=json.load(sys.stdin); d=(data.get("deployments") or [{}])[0]; print(d.get("state",""), d.get("created") or d.get("createdAt") or 0, d.get("url",""))' <<< "$body")"
    read -r state created dep_url <<< "$parsed"

    if [[ "$state" == "READY" && "$created" =~ ^[0-9]+$ && "$created" -ge "$since_ms" ]]; then
      log "Vercel reports ${label} deployment ready: https://${dep_url}"
      return
    fi

    if (( SECONDS >= deadline )); then
      fail "Timed out waiting for Vercel ${label} production deployment to become READY"
    fi
    sleep "$DEPLOY_POLL_SECONDS"
  done
}

deploy_to_production() {
  if [[ "$SKIP_DEPLOY" == "1" ]]; then
    log "SKIP_DEPLOY=1 set; not deploying to production"
    return
  fi

  local since_ms
  since_ms="$("${VENV_DIR}/bin/python" -c 'import time; print(int(time.time() * 1000))')"

  trigger_deploy_hook "${BLOWTORCH_API_DEPLOY_HOOK_URL:-}" "api"
  trigger_deploy_hook "${BLOWTORCH_WEB_DEPLOY_HOOK_URL:-}" "web"

  wait_for_vercel_ready "${BLOWTORCH_API_PROJECT_ID:-}" "api" "$since_ms"
  wait_for_vercel_ready "${BLOWTORCH_WEB_PROJECT_ID:-}" "web" "$since_ms"
}

verify_production() {
  if [[ "$SKIP_DEPLOY" == "1" ]]; then
    log "SKIP_DEPLOY=1 set; skipping production smoke verification"
    return
  fi

  log "Verifying production endpoints"
  wait_for_url "$PROD_API_HEALTH_URL" "production API"
  wait_for_url "$PROD_WEB_URL" "production web"
}

main() {
  log "Starting BLOWTORCH production pipeline"
  pull_latest_main
  install_dependencies
  run_static_analysis
  run_tests
  run_local_smoke_tests
  build_deployable_images
  deploy_to_production
  verify_production
  log "Pipeline completed successfully"
}

main "$@"
