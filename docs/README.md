# Documentation Structure

This directory contains archived documentation files. New frontend-specific documentation has been moved to the `client/` folder for better organization.

## Frontend Documentation

All frontend-specific documentation is now located in the `client/` folder:

- **[../client/AUTHENTICATION_SETUP.md](../client/AUTHENTICATION_SETUP.md)** - Complete authentication setup guide (Google OAuth & Password Reset)
- **[../client/GOOGLE_OAUTH_SETUP.md](../client/GOOGLE_OAUTH_SETUP.md)** - Detailed Google OAuth configuration guide
- **[../client/IMPLEMENTATION_SUMMARY.md](../client/IMPLEMENTATION_SUMMARY.md)** - Summary of implemented authentication features
- **[../client/README.md](../client/README.md)** - Frontend README with quick start guide

## Main Project Documentation

Project-wide documentation is organized by category:

### Setup & Development
- **[Setup and Development Guide](./setup/SETUP_AND_DEVELOPMENT.md)** - Local setup, development workflow, troubleshooting, and feature roadmap
- **[Feature Summary](./setup/FEATURE_SUMMARY.md)** - Executive summary and quick reference guide

### Deployment
- **[Deployment Guide](./deployment/DEPLOYMENT.md)** - Complete deployment guides for Railway, Render, Vercel, and production checklists
- **[Railway Admin Setup](./deployment/RAILWAY_ADMIN_SETUP.md)** - Guide for creating admin user on Railway
- **[Railway Start Command Fix](./deployment/RAILWAY_START_COMMAND_FIX.md)** - Fix for Railway start command errors
- **[Vercel-Railway Connection Fix](./deployment/VERCEL_RAILWAY_CONNECTION_FIX.md)** - Fix for Vercel-Railway connection issues

### Troubleshooting
- **[Troubleshooting Guide](./troubleshooting/TROUBLESHOOTING.md)** - Common issues and solutions

### Root Documentation
- **[../README.md](../README.md)** - Project overview and quick start guide

## Why This Structure?

The documentation was reorganized to:
- **Improve discoverability** - Frontend docs are with frontend code
- **Better organization** - Related information grouped logically
- **Easier maintenance** - Documentation lives with the code it describes
- **Clear navigation** - Easy to find what you need

## Finding Information

- **Need to set up locally?** → See [Setup and Development Guide](./setup/SETUP_AND_DEVELOPMENT.md)
- **Want to deploy?** → See [Deployment Guide](./deployment/DEPLOYMENT.md)
- **Having issues?** → See [Troubleshooting Guide](./troubleshooting/TROUBLESHOOTING.md)
- **Looking for project overview?** → See [README.md](../README.md) (root)
- **Frontend setup/auth?** → See `client/README.md` and `client/AUTHENTICATION_SETUP.md`
- **Planning new features?** → See [Feature Summary](./setup/FEATURE_SUMMARY.md)
