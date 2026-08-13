# The Verified Bag Frontend

## Backend URL

The frontend reads `BACKEND_URL` at build time. It must be the full Laravel API base URL, including `/api/v1`.

- Local development: use `http://localhost:8000/api/v1`. Vite derives its local proxy from this value so the browser continues using a same-origin `/api/v1` request.
- Vercel production: use the deployed API base URL, for example `https://api.example.com/api/v1`.

For Vercel, configure `BACKEND_URL` for Production and Preview. Vite's development server and its proxy are not used in a Vercel deployment.

The deployed backend must allow the Vercel frontend origin in its CORS configuration. Do not place credentials or secrets in `BACKEND_URL`.
