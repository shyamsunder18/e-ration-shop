# Frontend-Backend Integration Guide

This document maps the Frontend UI requirements to the available Backend APIs.

## 1. Authentication
The backend uses **HTTP-Only Cookies**.
**Frontend Requirement**: Ensure all API requests include `credentials: "include"`.

| Feature | Endpoint | Method | Role | Payload |
| :--- | :--- | :--- | :--- | :--- |
| **Register** | `/api/auth/register` | POST | Public | `{ name, email, password, role: "USER"|"VENDOR", ... }` |
| **Login** | `/api/auth/login` | POST | Public | `{ email, password }` |
| **Logout** | `/api/auth/logout` | POST | Public | `{}` |
| **Session Restore** | `/api/auth/me` | GET | Authenticated | N/A |

> **Note on Session Restore**: Call `/api/auth/me` on app launch.
> - If 200 OK: User is logged in. Store user data in global state (Context/Redux).
> - If 401: User is not logged in. Redirect to Login if on a protected route.

## 2. Admin Dashboard
Access: `role === 'ADMIN'`

| Feature | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Dashboard Stats** | `/api/admin/stats` | GET | Total users, active vendors, orders count. |
| **List Vendors** | `/api/admin/vendors` | GET | List all vendors with status. |
| **Approve Vendor** | `/api/admin/vendors/:id/status` | PUT | Body: `{ status: "APPROVED" }` |
| **Reject Vendor** | `/api/admin/vendors/:id/status` | PUT | Body: `{ status: "REJECTED" }` |
| **Complaints** | `/api/admin/complaints` | GET | View user complaints. |
| **Create Product** | `/api/products` | POST | Body: `{ name, unit, thumbnail }` |

## 3. Vendor Dashboard
Access: `role === 'VENDOR'` AND `status === 'APPROVED'`

| Feature | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **My Inventory** | `/api/inventory` | GET | View current stock levels. |
| **Update Stock** | `/api/inventory/:productId` | PUT | Body: `{ quantity, pricePerUnit }` |
| **Incoming Orders** | `/api/orders` | GET | View orders assigned to this vendor. |
| **Pack Order** | `/api/orders/:id/status` | PUT | Body: `{ status: "PACKED" | "DELIVERED" }` |

## 4. User Dashboard
Access: `role === 'USER'`

| Feature | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Browse Items** | `/api/products` | GET | Public list of ration items. |
| **Get Cart** | `/api/cart` | GET | View current cart items. |
| **Add to Cart** | `/api/cart` | POST | Body: `{ productId, quantity }` |
| **Checkout** | `/api/orders` | POST | Body: `{ vendorId }`. Creates PENDING order. |
| **Order History** | `/api/orders` | GET | View my past orders. |
| **Simulate Pay** | `/api/payments/simulate` | POST | Body: `{ orderId, amount }`. Sets order to PAID. |
| **Complaint** | `/api/complaints` | POST | Body: `{ subject, description }` |

## 5. Error Handling
The backend returns errors in a standard format:
```json
{
  "success": false,
  "message": "Error description here"
}
```

**Frontend Handling:**
- **401 Unauthorized**: Redirect to Login.
- **403 Forbidden**: Show "Access Denied" toast.
- **400/422**: Show validation error message from `response.data.message`.
- **500**: Show "Server Error, please try again".
