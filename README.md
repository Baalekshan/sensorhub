# Project Overview

This project consists of a mobile app and a web app, each with its own frontend and backend components. Below is a detailed description of the file structure and the purpose of each key file.

## Mobile App

### File Structure

- **app.json**: Configuration file for the Expo app, including app metadata and platform-specific settings.
- **tsconfig.json**: TypeScript configuration file, extending Expo's base configuration and enforcing strict type checking.
- **package.json**: Lists the dependencies and scripts for running the mobile app.
- **node_modules/**: Contains all the npm packages installed for the project.
- **app/**: Contains the main application code.
- **assets/**: Contains images and other static assets.
- **components/**: Reusable React components used throughout the app.
- **constants/**: Contains constant values used across the app.
- **context/**: Context API setup for state management.
- **hooks/**: Custom React hooks.

### Key Features

- Built with React Native and Expo for cross-platform mobile development.
- Utilizes TypeScript for type safety and better developer experience.
- Includes a variety of reusable components and hooks.

## Web App

### File Structure

- **package.json**: Lists the dependencies and scripts for running the web app.
- **node_modules/**: Contains all the npm packages installed for the project.
- **components/**: Reusable React components used throughout the app.
- **lib/**: Utility functions and libraries.
- **backend/**: Contains the backend code, built with NestJS.
  - **src/**: Source code for the backend.
    - **app.module.ts**: Main application module, importing various feature modules and setting up global configurations.
    - **main.ts**: Entry point of the application, setting up the NestJS app and starting the server.
    - **common/**: Contains common utilities, guards, and interceptors.
    - **auth/**: Authentication module.
    - **users/**: User management module.
    - **devices/**: Device management module.
    - **sensors/**: Sensor data management module.
    - **notifications/**: Notification handling module.
    - **analytics/**: Analytics and reporting module.
    - **websocket/**: WebSocket setup for real-time communication.
  - **Dockerfile**: Docker configuration for containerizing the backend.
  - **docker-compose.yml**: Docker Compose configuration for setting up the development environment.

### Key Features

- Built with Next.js for server-side rendering and static site generation.
- Backend powered by NestJS, providing a robust and scalable architecture.
- Utilizes GraphQL for efficient data fetching and real-time updates.

## Getting Started

### Mobile App

1. Navigate to the `mobile_app` directory.
2. Install dependencies: `npm install`
3. Start the app: `npm run dev`

### Web App

1. Navigate to the `web` directory.
2. Install dependencies: `npm install`
3. Start the app: `npm run dev`

## Contributing

Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. 