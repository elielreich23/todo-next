# Taskero Frontend - Next.js Client

Modern React/Next.js frontend application for the Taskero task management platform.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Features](#features)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Environment Variables](#environment-variables)
- [Development](#development)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend server running (see root `README.md`)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✨ Features

- **🔐 Authentication**: JWT-based auth with Google OAuth support
- **📊 Dashboard**: Comprehensive task and project overview
- **📅 Calendar View**: FullCalendar integration for task scheduling
- **🎨 Modern UI**: Responsive design with dark/light theme support
- **🔒 Password Strength**: Real-time password validation
- **📱 Responsive**: Mobile-first design approach

---

## 📁 Project Structure

```
client/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable React components
│   ├── contexts/         # React context providers
│   ├── constants/        # Application constants
│   ├── lib/              # Utility libraries
│   ├── hooks/            # Custom React hooks
│   └── styles/           # Global styles
├── public/               # Static assets
└── package.json
```

---

## 📚 Documentation

Frontend and auth guides live under [`docs/setup/`](../docs/setup/):

- **[AUTHENTICATION_SETUP.md](../docs/setup/AUTHENTICATION_SETUP.md)** - Google OAuth and password reset setup
- **[GOOGLE_OAUTH_SETUP.md](../docs/setup/GOOGLE_OAUTH_SETUP.md)** - Google OAuth configuration
- **[AUTH_IMPLEMENTATION_SUMMARY.md](../docs/setup/AUTH_IMPLEMENTATION_SUMMARY.md)** - Auth feature implementation summary

For project-wide documentation, see the root [`README.md`](../README.md) and [`docs/README.md`](../docs/README.md).

---

## 🔧 Environment Variables

Create a `.env.local` file in the `client/` directory:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Note**: Restart the dev server after adding/modifying environment variables.

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Key Technologies

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **SCSS** - Styling
- **FullCalendar** - Calendar component

---

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Authentication Setup Guide](../docs/setup/AUTHENTICATION_SETUP.md)

---

For backend documentation and API details, see the root `README.md` and `backend/README.md`.
