# Deployment Guide for E-Ration Shop

This guide details how to deploy the E-Ration Shop application to the cloud.

## 1. Environment Variables

### Backend (`.env`)
Ensure these are set in your cloud provider's environment configuration.
| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Service Port | `5000` (or provided by host) |
| `MONGO_URI` | MongoDB Connection String | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for tokens | `very_long_secure_string` |
| `FRONTEND_URL` | URL of deployed frontend | `https://eration-frontend.vercel.app` |

### Frontend (`.env` or Build Settings)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL of deployed backend | `https://eration-backend.railway.app/api` |

---

## 2. Backend Deployment (Render / Railway / Heroku)

1.  **Repository**: Connect your GitHub repository.
2.  **Root Directory**: Set to `backend` (if repo has both front/back).
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `npm start`
5.  **Variables**: Add all variables from Section 1.

> **Important**:
> - We have enabled `trust proxy` in `app.ts` to support load balancers.
> - Cookies are set to `Secure: true` and `SameSite: none` when `NODE_ENV=production`. This requires your backend to be served over **HTTPS**.

## 3. Database (MongoDB Atlas)

1.  Create a Cluster (M0 Free Tier is fine).
2.  Create a Database User.
3.  Whitelist IP `0.0.0.0/0` (or your specific cloud provider IPs).
4.  Copy the Connection String and set as `MONGO_URI`.

## 4. Frontend Deployment (Vercel / Netlify)

1.  **Repository**: Connect GitHub repo.
2.  **Root Directory**: Set to `frontend` (or root if standalone).
3.  **Build Command**: `npm run build`
4.  **Output Directory**: `dist`
5.  **Environment Variables**:
    - Set `VITE_API_BASE_URL` to your Backend URL ending in `/api`.

## 5. Troubleshooting

-   **CORS Errors**: Check `FRONTEND_URL` matches your Vercel/Netlify domain exactly (no trailing slash).
-   **Cookies Not Set**:
    -   Ensure Backend is HTTPS.
    -   Ensure Frontend is HTTPS.
    -   Verify `credentials: 'include'` (or `true`) is set in frontend requests.
-   **Health Check**: Visit `YOUR_BACKEND_URL/api/health` to verify the server is running.
