# SprintTrack – Frontend

Client application for the SprintTrack system — an attendance and sprint tracking tool built as an extension of Redmine.

## Tech Stack

- Angular 21
- TypeScript
- Tailwind CSS 4
- Lucide Icons

## Prerequisites

- Node.js 18+
- npm 11+

## Installation

```bash
npm install
```

## Configuration

The API base URL is set directly in each service (`http://localhost:8080` by default). If your backend runs on a different address, update the `baseUrl` in the service files located at:

```
src/app/core/services/
```

## Running the Application

```bash
npm start
```

The app will be available at `http://localhost:4200`.

## Building for Production

```bash
npm run build
```

Build output is stored in the `dist/` directory.

## Backend

This application requires the SprintTrack backend to be running. See the [backend repository](https://github.com/janfelber/sprint-track-backend) for setup instructions.
