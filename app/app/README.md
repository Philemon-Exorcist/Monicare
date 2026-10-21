# Monicare frontend

The Next.js project is in this directory. From the repository root, run:

```sh
cd app/app
npm install
npm run dev
```

The frontend expects the FastAPI backend to be available at `http://localhost:8001` in development. To use a different backend, copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_API_BASE_URL`, and restart the frontend.

For a production build:

```sh
npm run build
npm run start
```

Set `NEXT_PUBLIC_API_BASE_URL` in the frontend deployment environment. Do not put backend credentials or payment-provider secrets in this public variable.
