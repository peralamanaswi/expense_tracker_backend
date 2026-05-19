# Expense Tracker Backend

Express API for the AI Expense Tracker.

## Render Settings

- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`

## Environment Variables

Add these in Render:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=https://your-frontend-vercel-url.vercel.app
```

Optional Google Vision OCR setup:

```env
GOOGLE_APPLICATION_CREDENTIALS=./vision-key.json
```

Only use `GOOGLE_APPLICATION_CREDENTIALS` if you also provide the credentials file securely in Render. Otherwise the app can fall back to local OCR behavior.

## Routes

- `GET /api/health`
- `GET /api/expenses`
- `GET /api/expenses/analytics`
- `POST /api/expenses`
- `POST /api/expenses/upload`
