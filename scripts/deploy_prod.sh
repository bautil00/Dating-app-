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
CURRENT_COMMIT_WAIT_SECONDS="${CURRENT_COMMIT_WAIT_SECONDS:-45}"
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

deploy_to_production() {
  if [[ "$SKIP_DEPLOY" == "1" ]]; then
    log "SKIP_DEPLOY=1 set; not deploying to production"
    return
  fi

  require_vercel_api_env
  deploy_vercel_project "${BLOWTORCH_API_PROJECT_ID}" "api"
  deploy_vercel_project "${BLOWTORCH_WEB_PROJECT_ID}" "web"
}

require_vercel_api_env() {
  [[ -n "${VERCEL_TOKEN:-}" ]] || fail "Missing VERCEL_TOKEN"
  [[ -n "${BLOWTORCH_API_PROJECT_ID:-}" ]] || fail "Missing BLOWTORCH_API_PROJECT_ID"
  [[ -n "${BLOWTORCH_WEB_PROJECT_ID:-}" ]] || fail "Missing BLOWTORCH_WEB_PROJECT_ID"
}

vercel_team_query() {
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    printf '?teamId=%s' "${VERCEL_TEAM_ID}"
  fi
}

vercel_team_query_joiner() {
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    printf '&teamId=%s' "${VERCEL_TEAM_ID}"
  fi
}

deploy_vercel_project() {
  local project_id="$1"
  local label="$2"

  if promote_current_commit_deployment "$project_id" "$label"; then
    return
  fi

  log "No READY deployment for the current commit found for ${label}; falling back to redeploying latest READY production deployment"
  create_vercel_redeployment "$project_id" "$label"
}

promote_current_commit_deployment() {
  local project_id="$1"
  local label="$2"
  local git_sha deadline

  git_sha="$(git rev-parse HEAD)"
  deadline=$((SECONDS + CURRENT_COMMIT_WAIT_SECONDS))

  while true; do
    local body info deployment_id state deployment_url error_message
    body="$(curl -fsS -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      "https://api.vercel.com/v6/deployments?projectId=${project_id}&target=production&limit=20$(vercel_team_query_joiner)")"
    info="$("${VENV_DIR}/bin/python" -c 'import json,sys; git_sha=sys.argv[1]; data=json.load(sys.stdin); matches=[d for d in data.get("deployments", []) if ((d.get("meta") or {}).get("gitCommitSha") == git_sha)]; d=matches[0] if matches else {}; print("\t".join(str(v or "") for v in (d.get("uid") or d.get("id"), d.get("state") or d.get("readyState"), d.get("url"), d.get("errorMessage") or d.get("errorCode"))))' "$git_sha" <<< "$body")"
    IFS=$'\t' read -r deployment_id state deployment_url error_message <<< "$info"

    if [[ -n "$deployment_id" ]]; then
      if [[ "$state" == "READY" ]]; then
        log "Promoting ${label} deployment for current commit ${git_sha:0:7}: https://${deployment_url}"
        promote_vercel_deployment "$project_id" "$deployment_id" "$label"
        return 0
      fi

      if [[ "$state" == "ERROR" || "$state" == "CANCELED" ]]; then
        fail "Vercel ${label} deployment for current commit ended with ${state}: ${error_message}"
      fi
    fi

    if (( SECONDS >= deadline )); then
      return 1
    fi
    sleep "$DEPLOY_POLL_SECONDS"
  done
}

promote_vercel_deployment() {
  local project_id="$1"
  local deployment_id="$2"
  local label="$3"

  curl -fsS -X POST \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    "https://api.vercel.com/v10/projects/${project_id}/promote/${deployment_id}$(vercel_team_query)" \
    >/dev/null

  log "Promoted ${label} deployment: ${deployment_id}"
}

latest_vercel_deployment_id() {
  local project_id="$1"
  local query="projectId=${project_id}&target=production&limit=20"
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    query="${query}&teamId=${VERCEL_TEAM_ID}"
  fi

  local body deployment_id
  body="$(curl -fsS -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    "https://api.vercel.com/v6/deployments?${query}")"
  deployment_id="$(
    "${VENV_DIR}/bin/python" -c 'import json,sys; data=json.load(sys.stdin); deployments=data.get("deployments") or []; ready=[d for d in deployments if d.get("state") == "READY" or d.get("readyState") == "READY"]; [print("\t".join(str(v or "") for v in (d.get("uid") or d.get("id"), (d.get("meta") or {}).get("gitCommitSha")))) for d in ready]' <<< "$body" |
      while IFS=$'\t' read -r candidate_id candidate_sha; do
        [[ -n "$candidate_id" ]] || continue
        if [[ -n "$candidate_sha" ]] && git merge-base --is-ancestor "$candidate_sha" HEAD 2>/dev/null; then
          printf '%s\t%s\n' "$(git rev-list --count "${candidate_sha}..HEAD")" "$candidate_id"
        fi
      done |
      sort -n |
      awk 'NR == 1 { print $2 }'
  )"

  if [[ -z "$deployment_id" ]]; then
    deployment_id="$("${VENV_DIR}/bin/python" -c 'import json,sys; data=json.load(sys.stdin); deployments=data.get("deployments") or []; ready=next((d for d in deployments if d.get("state") == "READY" or d.get("readyState") == "READY"), {}); print(ready.get("uid") or ready.get("id") or "")' <<< "$body")"
  fi

  [[ -n "$deployment_id" ]] || fail "Could not find a previous READY production deployment for ${project_id}"
  printf '%s' "$deployment_id"
}

create_vercel_redeployment() {
  local project_id="$1"
  local label="$2"
  local previous_id body response deployment_id deployment_url

  previous_id="$(latest_vercel_deployment_id "$project_id")"
  body="{\"name\":\"${label}\",\"deploymentId\":\"${previous_id}\",\"project\":\"${project_id}\",\"target\":\"production\",\"withLatestCommit\":true}"

  log "Triggering ${label} production deployment via Vercel REST API"
  response="$(curl -fsS -X POST \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$body" \
    "https://api.vercel.com/v13/deployments$(vercel_team_query)")"

  deployment_id="$("${VENV_DIR}/bin/python" -c 'import json,sys; data=json.load(sys.stdin); print(data.get("id") or data.get("uid") or "")' <<< "$response")"
  deployment_url="$("${VENV_DIR}/bin/python" -c 'import json,sys; data=json.load(sys.stdin); print(data.get("url") or "")' <<< "$response")"
  [[ -n "$deployment_id" ]] || fail "Vercel did not return a deployment id for ${label}"

  if [[ -n "$deployment_url" ]]; then
    log "Created ${label} deployment: https://${deployment_url}"
  else
    log "Created ${label} deployment: ${deployment_id}"
  fi

  wait_for_vercel_deployment_id "$deployment_id" "$label"
}

wait_for_vercel_deployment_id() {
  local deployment_id="$1"
  local label="$2"
  local deadline=$((SECONDS + DEPLOY_TIMEOUT_SECONDS))

  while true; do
    local body state deployment_url error_message
    body="$(curl -fsS -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      "https://api.vercel.com/v13/deployments/${deployment_id}$(vercel_team_query)")"
    state="$("${VENV_DIR}/bin/python" -c 'import json,sys; data=json.load(sys.stdin); print(data.get("readyState") or data.get("state") or "")' <<< "$body")"
    deployment_url="$("${VENV_DIR}/bin/python" -c 'import json,sys; data=json.load(sys.stdin); print(data.get("url") or "")' <<< "$body")"
    error_message="$("${VENV_DIR}/bin/python" -c 'import json,sys; data=json.load(sys.stdin); print(data.get("errorMessage") or data.get("errorCode") or "")' <<< "$body")"

    if [[ "$state" == "READY" ]]; then
      log "Vercel reports ${label} deployment ready: https://${deployment_url}"
      return
    fi

    if [[ "$state" == "ERROR" || "$state" == "CANCELED" ]]; then
      fail "Vercel ${label} deployment ended with ${state}: ${error_message}"
    fi

    if (( SECONDS >= deadline )); then
      fail "Timed out waiting for Vercel ${label} deployment ${deployment_id} to become READY"
    fi
    sleep "$DEPLOY_POLL_SECONDS"
  done
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
