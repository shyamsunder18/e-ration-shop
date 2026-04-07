# How to Run E-Ration Shop Locally

This guide will help you set up and run both the Frontend and Backend of the E-Ration Shop application on your local machine.

## Prerequisites

1.  **Node.js**: Ensure you have Node.js (v18+ recommended) installed.
2.  **MongoDB**: You need a running MongoDB instance.
    -   **Option A**: Install MongoDB Community Edition locally.
    -   **Option B**: Use [MongoDB Atlas](https://www.mongodb.com/atlas) (Free Tier) and get the connection string.

---

## Step 1: Backend Setup

The backend handles the API, database, and authentication.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    -   Create a `.env` file from the example:
        ```bash
        cp .env.example .env
        ```
    -   Open `.env` and verify the settings. Default `MONGO_URI` is set for a local database. Valid keys:
        ```env
        PORT=5001
        MONGO_URI=mongodb://localhost:27017/e-ration-shop
        JWT_SECRET=dev_secret_123
        FRONTEND_URL=http://localhost:5173
        NODE_ENV=development
        ```

4.  **Start the Server:**
    ```bash
    npm run dev
    ```
    -   You should see: `Server running in development mode on port 5001`
    -   Database: `MongoDB Connected: ...`
    -   Seeding: `Admin user seeded successfully...`

---

## Step 2: Frontend Setup

The frontend is the user interface built with React/Vite.

1.  **Open a NEW terminal window** (keep backend running).

2.  **Navigate to the project root:**
    ```bash
    # If you are in backend/, go back up
    cd ..
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    ```

4.  **Configure Environment Variables:**
    -   Create a `.env` file in the root (if not exists), or ensure Vite picks up the default.
    -   Vite uses `.env` in the root. Add this line:
        ```env
        VITE_API_URL=http://localhost:5001/api
        ```

5.  **Start the Frontend:**
    ```bash
    npm run dev
    ```
    -   You should see: `Local: http://localhost:5173/`

---

## Step 3: Verification

1.  Open your browser and go to `http://localhost:5173`.
2.  **Login as Admin:**
    -   Email: `admin@gov.in`
    -   Password: `admin123`
3.  **Test Backend Connection:**
    -   If you can log in, the backend is connected!
    -   Check the "Health" status: Visit `http://localhost:5001/api/health`.

---

## Troubleshooting

-   **Connection Refused**: Ensure MongoDB is running (`mongod` or Docker container).
-   **CORS Error**: Ensure `FRONTEND_URL` in `backend/.env` matches exactly `http://localhost:5173` (no trailing slash).
-   **Login Fails (403/401)**:
    -   **Port Conflict**: macOS uses port 5000 for AirPlay. We have switched to **5001**. Ensure your backend is running on 5001.
    -   Check backend console for errors. Ensure you seeded the admin user (happens automatically on first run).
