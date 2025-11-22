# CI/CD Pipeline Setup Guide

This document describes the CI/CD pipeline configuration for the Taskero project.

## Overview

The project uses GitHub Actions for continuous integration and deployment. The pipeline includes:

- **CI Pipeline**: Automated testing, linting, and code quality checks
- **CD Pipeline**: Automated building and deployment of Docker images
- **PR Checks**: Code quality and security checks for pull requests
- **Nightly Tests**: Comprehensive test suite across multiple versions
- **Dependabot**: Automated dependency updates

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request to main/master/develop branches.
**Jobs:**
- **Frontend CI**: Linting, type checking, and building the Next.js application
- **Backend CI**: Code formatting, linting, Django checks, and tests
- **Docker Build Test**: Validates Docker images can be built
- **Security Scan**: Checks for vulnerabilities in dependencies

**Requirements:**
- Node.js 18
- Python 3.10
- PostgreSQL (for testing)

### 2. CD Pipeline (`.github/workflows/cd.yml`)

Runs on pushes to main/master and version tags.

**Jobs:**
- **Build and Push**: Builds and pushes Docker images to GitHub Container Registry
- **Deploy to Staging**: Deploys to staging environment (develop branch)
- **Deploy to Production**: Deploys to production environment (main/master branch)
- **Notify**: Sends deployment notifications

**Required Secrets:**
- `GITHUB_TOKEN` (automatically provided)
- `STAGING_URL` - Staging environment URL
- `STAGING_API_URL` - Staging API URL
- `STAGING_DB_URL` - Staging database URL
- `PRODUCTION_URL` - Production environment URL
- `PRODUCTION_API_URL` - Production API URL
- `PRODUCTION_DB_URL` - Production database URL
- `NEXT_PUBLIC_API_BASE_URL` - Frontend API base URL

### 3. PR Checks (`.github/workflows/pr-checks.yml`)

Runs on pull request events.

**Checks:**
- Semantic PR title validation
- Large file detection
- Secret scanning
- Dependency review

### 4. Nightly Tests (`.github/workflows/nightly-tests.yml`)

Runs daily at 2 AM UTC and can be manually triggered.

**Tests:**
- Full test suite across multiple Python versions (3.10, 3.11, 3.12)
- Full test suite across multiple Node.js versions (18, 20)

## Setup Instructions

### 1. GitHub Secrets Configuration

Go to your repository settings → Secrets and variables → Actions, and add the following secrets:

#### Required Secrets:
```
STAGING_URL=https://staging.yourdomain.com
STAGING_API_URL=https://api-staging.yourdomain.com
STAGING_DB_URL=postgresql://user:pass@host:5432/dbname
PRODUCTION_URL=https://yourdomain.com
PRODUCTION_API_URL=https://api.yourdomain.com
PRODUCTION_DB_URL=postgresql://user:pass@host:5432/dbname
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### 2. Environment Variables

Copy the example environment files and configure them:

```bash
# Root level
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend
cp client/.env.example client/.env.local
```

### 3. Pre-commit Hooks (Optional but Recommended)

Install pre-commit hooks to run checks before committing:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

### 4. Local Testing

Test the CI pipeline locally:

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
black --check .
isort --check-only .
flake8 .
python manage.py check --deploy
python manage.py test
```

## Deployment Configuration

### Docker Images

The CD pipeline builds and pushes Docker images to GitHub Container Registry:

- `ghcr.io/<username>/todo-next/frontend:latest`
- `ghcr.io/<username>/todo-next/backend:latest`

### Deployment Environments

#### Staging
- Triggered on: `develop` branch pushes
- Manual trigger: Workflow dispatch with `environment: staging`
- Environment: `staging` (configure in GitHub repository settings)

#### Production
- Triggered on: `main`/`master` branch pushes or version tags (`v*`)
- Manual trigger: Workflow dispatch with `environment: production`
- Environment: `production` (configure in GitHub repository settings)

### Custom Deployment Scripts

Update the deployment steps in `.github/workflows/cd.yml` with your deployment commands:

**Example for Kubernetes:**
```yaml
- name: Deploy to production
  run: |
    kubectl set image deployment/frontend frontend=${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}:${{ github.sha }}
    kubectl set image deployment/backend backend=${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:${{ github.sha }}
```

**Example for Docker Compose:**
```yaml
- name: Deploy to production
  run: |
    docker-compose pull
    docker-compose up -d
```

**Example for Cloud Providers:**
- AWS: Use AWS CLI or ECS deployment
- Google Cloud: Use gcloud CLI or Cloud Run
- Azure: Use Azure CLI or Container Instances

## Code Quality Tools

### Frontend
- **ESLint**: Code linting (configured in `client/.eslintrc.json`)
- **TypeScript**: Type checking
- **Next.js**: Built-in linting and type checking

### Backend
- **Black**: Code formatting (configured in `backend/pyproject.toml`)
- **isort**: Import sorting (configured in `backend/pyproject.toml`)
- **Flake8**: Code linting (configured in `backend/.flake8`)
- **Pytest**: Testing framework (configured in `backend/pytest.ini`)
- **Bandit**: Security linting (via pre-commit)

## Dependabot

Dependabot is configured to automatically:
- Check for dependency updates weekly
- Create pull requests for updates
- Auto-merge PRs that pass CI (via `.github/workflows/dependabot-auto-merge.yml`)

Configuration: `.github/dependabot.yml`

## Monitoring and Notifications

### Health Checks

Add health check endpoints to verify deployments:

**Backend:**
```python
# backend/projects/views.py
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'healthy'}, status=200)
```

**Frontend:**
```javascript
// client/src/app/api/health/route.js
export async function GET() {
  return Response.json({ status: 'healthy' });
}
```

### Notifications

Configure notifications in the `notify` job of `cd.yml`:

- Slack: Use Slack webhook
- Email: Use email service
- Discord: Use Discord webhook
- Teams: Use Teams webhook

## Troubleshooting

### CI Pipeline Fails

1. **Linting errors**: Fix code style issues locally
2. **Test failures**: Run tests locally to debug
3. **Build failures**: Check Dockerfile and dependencies
4. **Timeout errors**: Increase timeout in workflow file

### CD Pipeline Fails

1. **Docker build fails**: Check Dockerfile syntax
2. **Deployment fails**: Verify secrets and deployment scripts
3. **Health checks fail**: Ensure services are running

### Common Issues

**Issue**: "Permission denied" errors
**Solution**: Check GitHub Actions permissions in repository settings

**Issue**: "Secret not found" errors
**Solution**: Ensure all required secrets are configured

**Issue**: "Docker build context" errors
**Solution**: Verify Dockerfile paths are correct

## Best Practices

1. **Always test locally** before pushing
2. **Use semantic commit messages** for better tracking
3. **Keep dependencies updated** via Dependabot
4. **Monitor CI/CD pipeline** for failures
5. **Review PR checks** before merging
6. **Use feature branches** for development
7. **Tag releases** for production deployments

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)

## Support

For issues or questions about the CI/CD pipeline:
1. Check the workflow logs in GitHub Actions
2. Review this documentation
3. Create an issue in the repository

