# SensorHub Unified Backend

This directory contains the unified backend system that serves both the SensorHub Mobile App and Web App for the smart sensing device ecosystem.

## Architecture

- Modular monolith architecture (easy to split into microservices later)
- NestJS framework for backend structure
- GraphQL API for client applications
- REST API for device communication
- PostgreSQL database for relational data
- Redis for real-time data streaming and caching
- Git-based sensor module repository integration

## Directory Structure

```
backend/
├── dist/               # Compiled JavaScript output
├── node_modules/       # Dependencies
├── src/
│   ├── main.ts         # Application entry point
│   ├── app.module.ts   # Root application module
│   ├── auth/           # Authentication and authorization
│   ├── users/          # User management
│   ├── devices/        # Device management
│   ├── sensors/        # Sensor management
│   │   ├── types/      # Sensor type definitions
│   │   ├── readings/   # Sensor readings data
│   │   └── calibration/# Calibration logic
│   ├── modules/        # Git-based module management
│   ├── notifications/  # Alert and notification system
│   ├── analytics/      # Data analytics services
│   ├── common/         # Shared utilities and services
│   └── config/         # Configuration files
├── test/               # Test files
└── package.json        # Project dependencies
```

## Getting Started

1. Install dependencies:
```bash
cd web/backend
npm install
```

2. Set up environment variables (create a .env file in the backend directory)

3. Start the development server:
```bash
npm run start:dev
```

4. For production:
```bash
npm run build
npm run start:prod
```

## Docker Setup

```bash
docker-compose up -d
``` 