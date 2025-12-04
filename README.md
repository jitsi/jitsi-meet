# Internxt Meet

[![node](https://img.shields.io/badge/node-20-iron)](https://nodejs.org/download/release/latest-iron/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green)](LICENSE)

Internxt Meet is a secure, private video conferencing platform built on top of Jitsi's framework, featuring strong cryptography, and seamless integration with the Internxt ecosystem. This application provides a privacy-focused alternative to mainstream video conferencing solutions.

![Internxt Meet](./images/internxt_Meet_Gallery.webp)

## Project Maintenance

Our development standards include:

- **TypeScript**: Strong typing throughout the application with proper interfaces and type definitions
- **React Best Practices**: Functional components, custom hooks, and Redux for state management
- **Testing**: Comprehensive test coverage with Vitest and React Testing Library
- **Code Quality**: ESLint with Internxt configuration for consistent code style
- **Continuous Integration**: Automated testing using Vitest with coverage reports
- **Sonar Scanning**: Code quality monitoring with SonarQube

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- yarn 1.x or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/internxt/meet-web.git
   cd meet-web
   ```

2. Create a `.npmrc` file from the `.npmrc.template` example provided in the repo:
   ```bash
   cp .npmrc.template .npmrc
   ```

3. Install dependencies:
   ```bash
   yarn install
   ```

4. Create an environment file from the template:
   ```bash
   cp .env.template .env
   ```

5. Configure the required environment variables in `.env` file.

### Scripts

#### `yarn start` or `make dev`
Runs the app in development mode using webpack-dev-server.
Open [http://127.0.0.1:8080/](http://127.0.0.1:8080/) to view it in the browser.
The page will reload if you make edits.

#### `yarn test`
Launches the Vitest test runner in interactive watch mode.

#### `yarn test:coverage`
Runs tests with coverage reports generated in the `coverage` directory.

#### `yarn lint`
Runs ESLint to check code quality and style issues across JavaScript and TypeScript files.

#### `yar lint-fix`
Automatically fixes linting issues where possible.

#### `make`
Compiles, deploys, and cleans up build artifacts for production.

## Architecture

The application is built on React and uses the following architecture:

### Key Directories

- `/react/features/base/meet`: Core Internxt Meet functionality

## Development Guidelines

### Component Structure

- Use functional components with hooks
- Separate container and presentational components
- Use TypeScript interfaces for props

### State Management

- Redux for global application state
- React hooks for component-local state
- Custom hooks for shared logic

### Testing

- Unit tests with Vitest

### Styling

- Tailwind CSS for styling
- Internxt UI components for consistent design
