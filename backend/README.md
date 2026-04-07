# E-Ration Shop Backend

This is the backend for the E-Ration Shop application, built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **Authentication**: JWT-based auth with Role-Based Access Control (Admin, Vendor, User).
- **Vendor Management**: Admin approval workflow for vendors.
- **Inventory System**: Vendors manage their own stock.
- **Order System**: Cart management and Order placement with stock validation.
- **Payment Simulation**: Mock payment flow.
- **Security**: Helmet, CORS, HTTP-only cookies.

## Prerequisites

- Node.js (v14+)
- MongoDB (Local or Atlas)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

3. **Start Server**
   ```bash
   # Development
   npm run dev

   # Build & Start
   npm run build
   npm start
   ```

## API Endpoints

- **Auth**: `/api/auth` (Register, Login, Me)
- **Products**: `/api/products` (GET public, POST admin)
- **Inventory**: `/api/inventory` (Vendor only)
- **Cart**: `/api/cart` (User only)
- **Orders**: `/api/orders` (Place order, View history, Update status)
- **Admin**: `/api/admin` (Manage vendors, Stats)

## Initial Seeding

On the first run, the server automatically seeds a default Admin user:
- **Email**: `admin@gov.in`
- **Password**: `admin123`

## Directory Structure

- `src/config`: DB connection
- `src/controllers`: Request handlers
- `src/middleware`: Auth & Error middleware
- `src/models`: Mongoose schemas
- `src/routes`: API routes
- `src/utils`: Helper functions (JWT, Seeder)

