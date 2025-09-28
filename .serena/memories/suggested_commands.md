# Development Commands

## Installation
```bash
npm i  # Install dependencies
```

## Development
```bash
npm run dev  # Start both frontend (Vite) and backend (Express) concurrently
npm run server  # Start only the backend server
```

## Build
```bash
npm run build  # Production build
npm run build:dev  # Development build
```

## Code Quality
```bash
npm run lint  # ESLint validation
```

## Preview
```bash
npm run preview  # Preview production build
```

## Environment Setup
Required environment variables in `.env`:
- `GHL_PERSONAL_INTEGRATION_TOKEN` - GoHighLevel API token
- `GHL_LOCATION_ID` - GoHighLevel location ID
- `PORT` (optional) - Server port, defaults to 3001

## System Commands (Linux)
- `git` - Version control
- `ls`, `cd` - File navigation
- `grep`, `find` - File searching
- `fish` - Default shell