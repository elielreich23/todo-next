# GitHub Actions Workflows

This directory contains all GitHub Actions workflows for CI/CD.

## Workflows

### CI Pipeline (`ci.yml`)
- Runs on: Push/PR to main, master, develop
- Jobs:
  - Frontend CI (lint, type-check, build)
  - Backend CI (format, lint, test)
  - Docker build test
  - Security scanning

### CD Pipeline (`cd.yml`)
- Runs on: Push to main/master, version tags, manual dispatch
- Jobs:
  - Build and push Docker images
  - Deploy to staging
  - Deploy to production
  - Notify deployment status

### PR Checks (`pr-checks.yml`)
- Runs on: Pull request events
- Checks:
  - Semantic PR titles
  - Large files
  - Secret scanning
  - Dependency review

### Nightly Tests (`nightly-tests.yml`)
- Runs on: Daily at 2 AM UTC, manual dispatch
- Tests across multiple Python and Node.js versions

### Dependabot Auto-merge (`dependabot-auto-merge.yml`)
- Runs on: Dependabot PRs
- Auto-merges PRs that pass CI

## Quick Start

1. **Configure Secrets**: Go to repository Settings → Secrets → Actions
2. **Enable Workflows**: Workflows are enabled by default
3. **Monitor**: Check Actions tab for workflow runs

## Required Secrets

See `CI_CD_SETUP.md` for complete list of required secrets.

