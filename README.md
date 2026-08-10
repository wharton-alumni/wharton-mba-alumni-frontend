# Wharton EMBA Alumni Frontend

React + TypeScript frontend for the Wharton EMBA Alumni Portal. This project intentionally uses Vite React instead of Next.js.

## Run locally

```bash
npm install
npm run dev
```

The app expects the Spring Boot API at `https://api.whartonemba.com/api`. Override with:

```bash
VITE_API_BASE_URL=http://localhost:8080/api npm run dev
```
