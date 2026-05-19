# BLOWTORCH CI/CD Pipeline Guide

This guide describes the one-touch production pipeline for the BLOWTORCH app.

The pipeline script is [`scripts/deploy_prod.sh`](../scripts/deploy_prod.sh). It uses Docker for packaging and Vercel's REST API for production deployment/status checks instead of the Vercel CLI.

## Accepted PRs In The Past Week

As of May 18, 2026, the public GitHub API shows one merged PR in the past week:

| PR | Merged | Static analysis | Review evidence |
| --- | --- | --- | --- |
| [#1 Llm compatibility](https://github.com/bautil00/Dating-app-/pull/1) | 2026-05-13 | Covered by the repository checks and by this pipeline before deployment. | Human review/comment added by `owenisas` on 2026-05-18; Copilot also reviewed the PR. |

Repository link for PR and code standards review: <https://github.com/bautil00/Dating-app->

## What The Pipeline Does

1. Pulls the latest code from `origin/main`.
2. Installs backend and frontend dependencies.
3. Runs backend static/security analysis:
   - `ruff check`
   - `ruff format --check`
   - `pyright`
   - `bandit`
4. Runs frontend static/security analysis:
   - ESLint
   - TypeScript typecheck
   - Prettier format check
   - `npm audit --audit-level=high`
5. Runs backend and frontend tests:
   - FastAPI/Python tests with `pytest`
   - React/Vite tests with `vitest`
6. Runs smoke tests:
   - Starts the FastAPI app locally and checks `/health`
   - Builds the frontend, starts Vite preview locally, and checks `/login`
7. Packages deployable Docker images:
   - `blowtorch-api:<git-sha>`
   - `blowtorch-web:<git-sha>`
8. Triggers production deploys through Vercel's REST API.
9. Polls the Vercel REST API until each production deployment is `READY`.
10. Verifies production URLs are reachable.

## Required Local Tools

Install these before running the pipeline:

- Git
- Python 3.12 or newer
- Node.js 20 or newer
- npm
- Docker Desktop or another Docker daemon
- curl

## Required Secrets

Do not commit these values to Git.

Set the Vercel REST API values in your shell before running the script:

```bash
export VERCEL_TOKEN="..."
export BLOWTORCH_API_PROJECT_ID="prj_..."
export BLOWTORCH_WEB_PROJECT_ID="prj_..."
# Only needed for team-owned projects:
export VERCEL_TEAM_ID="team_..."
```

If the instructor needs the secrets, put them in a password-protected zip file and email the zip file and password as requested in the assignment. Do not add the zip file to the repository.

## Production URLs

The script uses these default smoke-test URLs:

```bash
export PROD_API_HEALTH_URL="https://api-lemon-psi-31.vercel.app/health"
export PROD_WEB_URL="https://web-two-beta-72.vercel.app"
```

Override them if production moves to a new Vercel URL or custom domain.

## Run The Pipeline

From the repository root:

```bash
chmod +x scripts/deploy_prod.sh
./scripts/deploy_prod.sh
```

A successful run ends with:

```text
Pipeline completed successfully
```

Logs from local smoke servers are written to `.pipeline-logs/`.

## Dry Runs

Use a dry run when you want to verify checks, tests, smoke tests, and Docker packaging without deploying:

```bash
SKIP_DEPLOY=1 ./scripts/deploy_prod.sh
```

If Docker is not available on the machine and you only need to test the non-packaging stages:

```bash
SKIP_DEPLOY=1 SKIP_DOCKER=1 ./scripts/deploy_prod.sh
```

For local development only, skip pulling from `main`:

```bash
SKIP_PULL=1 SKIP_DEPLOY=1 ./scripts/deploy_prod.sh
```

The full production submission should run without `SKIP_DEPLOY=1` and without `SKIP_DOCKER=1`.
