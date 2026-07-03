Software Requirements Specification (SRS)

Hotel Management System

1. Introduction

## 1.1 Purpose

This document defines the functional and non-functional requirements for a Hotel Management web application. It serves as the reference specification for backend development teams regardless of their chosen technology stack.

## 1.2 Scope

The system is a RESTful backend API for a hotel management platform divided into two main roles: Admin and User. It handles room management, bookings, offers, favourites, ratings, and a dashboard with analytics.

## 1.3 Technology Stack

The following choices are left to the implementing team:

| Concern | Options |
| --- | --- |
| Runtime | Node.js |
| Language | JavaScript or TypeScript |
| Framework | Express.js or NestJS |
| Database | MongoDB, MySQL, or PostgreSQL |
| ORM / ODM | Mongoose (MongoDB) / Sequelize or Prisma (MySQL, PostgreSQL) |
| API Docs | Postman Collection or Swagger |
| Auth | JWT (JSON Web Tokens) |
| File Storage | Local disk or cloud (e.g. Cloudinary) for room images |

2. Overall Description

## 2.1 System Overview

The application exposes a RESTful API consumed by a frontend client. It supports two user roles with distinct permissions, and one anonymous access level.

## 2.2 User Roles

| Role | Description |
| --- | --- |
| Admin | Full control over rooms, bookings, users, and offers |
| Logged-in User | Can book rooms, manage favourites, and submit reviews |
| Anonymous User | Read-only access to landing page, room search, and offers |

## 2.3 Assumptions & Constraints

- All protected routes require a valid JWT in the Authorization: Bearer <token> header.
- Passwords must be hashed before storage (bcrypt recommended).
- The system supports bilingual content: Arabic and English.
- Images are uploaded as multipart form data.
- Discount is stored as a percentage on the room record.

3. Functional Requirements

## 3.1 Authentication Module (Admin & User)

Both roles share the same auth flow but are distinguished by a role field (admin / user).

## 3.1.1 Register

- POST /api/auth/register
- Access: Public (User registration only; Admin is seeded or created internally)
- Body: name, email, password, confirmPassword, phone (optional), profileImage (optional)
- Behaviour:
  - Validate all fields.
  - Check email uniqueness.
  - Hash password before saving.
  - Return JWT on success.

## 3.1.2 Login

- POST /api/auth/login
- Access: Public
- Body: email, password
- Behaviour:
  - Verify credentials.
  - Return JWT containing userId, role, email.

## 3.1.3 Get My Profile

- GET /api/auth/me
- Access: Logged-in User / Admin
- Behaviour: Returns current user's data from the decoded JWT.

## 3.1.4 Update Profile

- PUT /api/auth/me
- Access: Logged-in User / Admin
- Body: Any updatable user fields (name, phone, profileImage)

## 3.1.5 Change Password

- PUT /api/auth/change-password
- Access: Logged-in User / Admin
- Body: currentPassword, newPassword, confirmNewPassword

## 3.2 Admin — Room Management (CRUD)

## 3.2.1 Create Room

- POST /api/admin/rooms
- Access: Admin only
- Body (multipart/form-data): roomNumber, capacity, price, discount (%), description, facilities (array / multi-select), images (files)
- Behaviour: Save room with all fields; store image paths/URLs.

## 3.2.2 Get All Rooms

- GET /api/admin/rooms
- Access: Admin only
- Query Params: page, limit, search
- Behaviour: Returns paginated list of all rooms.

## 3.2.3 Get Single Room

- GET /api/admin/rooms/:id
- Access: Admin only

## 3.2.4 Update Room

- PUT /api/admin/rooms/:id
- Access: Admin only
- Body: Any updatable room fields.

## 3.2.5 Delete Room

- DELETE /api/admin/rooms/:id
- Access: Admin only
- Behaviour: Soft-delete recommended; reject if active bookings exist.

## 3.3 Admin — Bookings Management

## 3.3.1 Get All Bookings

- GET /api/admin/bookings
- Access: Admin only
- Query Params: page, limit, status, userId, roomId
- Behaviour: Returns all bookings across all users.

## 3.3.2 Get Single Booking

- GET /api/admin/bookings/:id
- Access: Admin only

## 3.3.3 Update Booking Status

- PUT /api/admin/bookings/:id/status
- Access: Admin only
- Body: status — one of pending, confirmed, cancelled, completed

## 3.4 Admin — User Management

## 3.4.1 Get All Users

- GET /api/admin/users
- Access: Admin only
- Query Params: page, limit, search

## 3.4.2 Get Single User

- GET /api/admin/users/:id
- Access: Admin only

## 3.4.3 Delete / Deactivate User

- DELETE /api/admin/users/:id
- Access: Admin only

## 3.5 Admin — Offers Management (CRUD)

## 3.5.1 Create Offer

- POST /api/admin/offers
- Access: Admin only
- Body (multipart/form-data): title, description, price, image

## 3.5.2 Get All Offers

- GET /api/admin/offers
- Access: Admin only

## 3.5.3 Update Offer

- PUT /api/admin/offers/:id
- Access: Admin only

## 3.5.4 Delete Offer

- DELETE /api/admin/offers/:id
- Access: Admin only

## 3.6 Admin — Dashboard & Analytics

## 3.6.1 Get Dashboard Stats

- GET /api/admin/dashboard
- Access: Admin only
- Response:
  - Total rooms, available rooms, occupied rooms
  - Total registered users
  - Total bookings (by status breakdown)
  - Total revenue / profit
  - Recent bookings (last 5–10)

## 3.6.2 Get Chart Data

- GET /api/admin/dashboard/charts
- Access: Admin only
- Response:
  - Rooms chart data (available vs occupied over time)
  - Users chart data (registrations over time)
  - Profit chart data (revenue per month)

## 3.7 User — Room Browsing & Search (Public)

## 3.7.1 Get All Available Rooms (Landing Page)

- GET /api/rooms
- Access: Public (Anonymous + Logged-in)
- Query Params: checkIn (date), checkOut (date), capacity, page, limit
- Behaviour: Returns rooms not booked in the given date range.

## 3.7.2 Get Single Room Details

- GET /api/rooms/:id
- Access: Public
- Response: Full room details including facilities, images, discount, average rating, and reviews.

## 3.8 User — Offers (Public)

## 3.8.1 Get All Offers

- GET /api/offers
- Access: Public

## 3.8.2 Get Single Offer

- GET /api/offers/:id
- Access: Public

## 3.9 User — Bookings

## 3.9.1 Create Booking (with Payment)

- POST /api/bookings
- Access: Logged-in User
- Body: roomId, checkIn, checkOut, paymentDetails (card number, expiry, CVV — for simulation only; do not store raw card data)
- Behaviour:
  - Validate room is available in the requested date range.
  - Calculate total price: nights × room price × (1 - discount/100).
  - Create booking with status pending or confirmed.
  - Return booking confirmation.

## 3.9.2 Get My Bookings

- GET /api/bookings/my
- Access: Logged-in User

## 3.9.3 Cancel Booking

- DELETE /api/bookings/:id
- Access: Logged-in User (own bookings only)
- Behaviour: Only cancellable if status is pending or confirmed and check-in has not passed.

## 3.10 User — Favourites

## 3.10.1 Add Room to Favourites

- POST /api/favourites/:roomId
- Access: Logged-in User
- Behaviour: Add if not already favourited; return error if duplicate.

## 3.10.2 Remove Room from Favourites

- DELETE /api/favourites/:roomId
- Access: Logged-in User

## 3.10.3 Get My Favourites

- GET /api/favourites
- Access: Logged-in User
- Response: List of favourited rooms with full room details.

## 3.11 User — Ratings & Comments

## 3.11.1 Add Review

- POST /api/rooms/:id/reviews
- Access: Logged-in User
- Body: rating (1–5), comment
- Behaviour:
  - A user can only review a room they have previously booked.
  - One review per user per room.
  - Recalculate and update the room's average rating on each new review.

## 3.11.2 Get Room Reviews

- GET /api/rooms/:id/reviews
- Access: Public
- Response: Paginated list of reviews with user name and rating.

## 3.11.3 Delete Review

- DELETE /api/rooms/:roomId/reviews/:reviewId
- Access: Logged-in User (own review) or Admin

4. Data Models (Schema Definitions)

These are database-agnostic logical models. Field types should be mapped to the appropriate types for your chosen database.

## 4.1 User

| Field | Type | Notes |
| --- | --- | --- |
| Id | UUID / ObjectId | Primary key |
| Name | String | Required |
| Email | String | Unique, required |
| password | String | Hashed, required |
| Phone | String | Optional |
| profileImage | String | URL/path |
| Role | Enum | admin, user |
| isActive | Boolean | Default true |
| createdAt | Timestamp | Auto |
| updatedAt | Timestamp | Auto |

## 4.2 Category

```javascript
_id
name
description
createdAt
updatedAt
```

## 4.3 facilities

```javascript
  _id:,
  name: {
    en: String,
    ar: String,
  },
  createdAt,
  updatedAt
```

## 4.4 Room

| Field | Type | Notes |
| --- | --- | --- |
| Id | UUID / ObjectId | Primary key |
| roomNumber | String | Unique |
| Capacity | Integer | Number of guests |
| Price | Decimal | Per night |
| discount | Integer | Percentage (0–100) |
| description | String | Optional |
| Facilities | Array of ObjectId | Multi-select values |
| Images | Array of String | URLs/paths |
| averageRating | Decimal | Computed field |
| isDeleted | Boolean | Soft delete flag |
| createdAt | Timestamp | Auto |
| updatedAt | Timestamp | Auto |
| categoryId | ObjectId / FK → Category | Category reference |

## 4.5 Booking

| Field | Type | Notes |
| --- | --- | --- |
| Id | UUID / ObjectId | Primary key |
| userId | FK → User | Required |
| roomId | FK → Room | Required |
| checkIn | Date | Required |
| checkOut | Date | Required |
| totalPrice | Decimal | Calculated |
| Status | Enum | pending, confirmed, cancelled, completed |
| createdAt | Timestamp | Auto |

## 4.6 Offer

| Field | Type | Notes |
| --- | --- | --- |
| Id | UUID / ObjectId | Primary key |
| Title | String | Required |
| description | String | Required |
| Price | Decimal | Required |
| Image | String | URL/path |
| createdAt | Timestamp | Auto |

## 4.7 Review

| Field | Type | Notes |
| --- | --- | --- |
| Id | UUID / ObjectId | Primary key |
| userId | FK → User | Required |
| roomId | FK → Room | Required |
| Rating | Integer | 1–5 |
| comment | String | Optional |
| createdAt | Timestamp | Auto |

## 4.8 Favourite

| Field | Type | Notes |
| --- | --- | --- |
| Id | UUID / ObjectId | Primary key |
| userId | FK → User | Required |
| roomId | FK → Room | Required |
| createdAt | Timestamp | Auto |

Unique constraint: (userId, roomId) must be unique in the Favourite table/collection.

5. Non-Functional Requirements

## 5.1 Security

- All passwords stored as bcrypt hashes (min 10 salt rounds).
- JWT tokens must expire (recommended: 7 days for users, 1 day for admins).
- Role-based middleware must guard all admin routes.
- Raw payment card data must never be persisted.
- Environment variables (.env) must store all secrets: DB URI, JWT secret, etc.

## 5.2 Validation

- All request bodies must be validated before processing (use a validation library appropriate to your stack: Joi, express-validator, class-validator for NestJS).
- Return descriptive, consistent error responses in the format:
```json
{
  "status": "error",
  "message": "Descriptive error message",
  "errors": []
}
```

## 5.3 Response Format

All API responses must follow a consistent envelope:

```json
{
  "status": "success",
  "message": "Optional message",
  "data": {}
}
```

## 5.4 Pagination

All list endpoints must support page and limit query parameters and return:

```json
{
  "data": [],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

5.5 Internationalisation (i18n)

- API should support an Accept-Language: ar or Accept-Language: en header.
- Error messages and user-facing strings should be returned in the requested language.

## 5.6 Performance

- List endpoints should always use pagination; no unbounded queries.
- Database queries on userId, roomId, checkIn, and checkOut fields should be indexed.

6. API Documentation

The team must deliver one of the following:

Option A — Postman:

- A fully exported Postman Collection (v2.1) with environment variables for baseURL and token.
- All endpoints grouped by module (Auth, Admin/Rooms, Admin/Bookings, etc.).
- Example request bodies and expected responses documented on each request.
Option B — Swagger:

- Auto-generated or manually written swagger.json / swagger.yaml.
- Accessible at /api/docs when the server is running.
- All schemas defined under components/schemas.
- JWT bearer auth configured under securitySchemes.

7. Folder Structure Recommendation

```text
src/
├── config/          # DB connection, env config
├── middlewares/     # auth, role guards, error handler
├── modules/
│   ├── auth/
│   ├── rooms/
│   ├── bookings/
│   ├── offers/
│   ├── favourites/
│   ├── reviews/
│   ├── users/       # Admin user management
│   └── dashboard/
├── utils/           # helpers, pagination, response formatter
└── app.js / main.ts
```

8. Out of Scope

- Real payment gateway integration (Stripe, PayPal) — payment is simulated.
- Email notifications.
- Admin creation via registration flow (seeded via script or DB directly).
- Mobile application.
