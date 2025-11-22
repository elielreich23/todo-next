# Quick Start: CI/CD Setup

## 🚀 5-Minute Setup Guide

### Step 1: Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
```
STAGING_URL=https://staging.yourdomain.com
STAGING_API_URL=https://api-staging.yourdomain.com
STAGING_DB_URL=postgresql://user:pass@host:5432/dbname
PRODUCTION_URL=https://yourdomain.com
PRODUCTION_API_URL=https://api.yourdomain.com
PRODUCTION_DB_URL=postgresql://user:pass@host:5432/dbname
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### Step 2: Enable GitHub Actions

Workflows are automatically enabled. Check the Actions tab to see them run.

### Step 3: Test Locally (Optional)

```bash
# Frontend
cd client
npm install
npm run lint
npm run build

# Backend
cd backend
pip install -r requirements.txt
pip install black flake8 isort pytest pytest-django
make check  # or: black --check . && isort --check-only . && flake8 .
```

### Step 4: Make Your First Commit

The CI pipeline will automatically run on push:

```bash
git add .
git commit -m "feat: add CI/CD pipeline"
git push
```

## 📋 What's Included

✅ **CI Pipeline**: Automated testing, linting, and building  
✅ **CD Pipeline**: Automated Docker builds and deployments  
✅ **PR Checks**: Code quality and security checks  
✅ **Dependabot**: Automated dependency updates  
✅ **Pre-commit Hooks**: Local code quality checks  

## 📚 Full Documentation

See [CI_CD_SETUP.md](CI_CD_SETUP.md) for complete documentation.

## 🆘 Troubleshooting

**CI fails?** Check the Actions tab for error details.

**Missing secrets?** Add them in Settings → Secrets → Actions.

**Need help?** See [CI_CD_SETUP.md](CI_CD_SETUP.md) troubleshooting section.

