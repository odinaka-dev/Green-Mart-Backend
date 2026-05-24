# Green Mart Backend

![Green Mart Banner](https://raw.githubusercontent.com/github/explore/main/topics/nodejs/nodejs.png)

## Overview

Green Mart Backend is an Express + TypeScript API for a grocery/e-commerce application. It supports user authentication, product management with Cloudinary image uploads, favorites, cart operations, and order creation.

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB / Mongoose
- Cloudinary
- JWT authentication
- Zod validation
- Multer file uploads
- Helmet, CORS, rate limiting for security

## Key Features

- User registration and login
- Password reset via OTP/verification code
- Product creation with image uploads to Cloudinary
- Product listing with pagination, search, and sorting
- Favorites management
- Shopping cart creation and update
- Order creation from cart contents

## Repository Structure

- `src/app.ts` - Express application setup and middleware pipeline
- `src/server.ts` - Application entry point and database connection bootstrap
- `src/config/db.ts` - MongoDB connection
- `src/config/cloudinary.ts` - Cloudinary configuration
- `src/config/multer.ts` - Multer memory storage config for file uploads
- `src/routes/` - Express routes
- `src/controller/` - Controller functions for request handling
- `src/services/` - Reusable business logic services
- `src/model/` - Mongoose data models
- `src/middleware/` - Request middleware
- `src/validators/` - Request validation utilities
- `src/utils/` - Utility helpers
- `src/types/` - custom type declarations

## Installed Packages

### Dependencies

- `bcryptjs` - password hashing
- `cloudinary` - Cloudinary SDK for image upload
- `cookie-parser` - cookie parsing middleware
- `cors` - cross-origin resource sharing
- `crypto` - Node.js crypto utilities
- `dotenv` - environment variable loading
- `express` - web framework
- `express-mongo-sanitize` - sanitize request data for MongoDB
- `express-rate-limit` - rate limiting middleware
- `helmet` - security headers
- `jsonwebtoken` - JWT creation and verification
- `mongoose` - MongoDB ODM
- `morgan` - request logging
- `multer` - multipart form-data file upload handling
- `nodemailer` - email transport (configured but used only as commented example)
- `zod` - schema validation

### Dev Dependencies

- `@types/bcryptjs`
- `@types/cookie-parser`
- `@types/cors`
- `@types/express`
- `@types/jsonwebtoken`
- `@types/morgan`
- `@types/multer`
- `@types/node`
- `nodemon`
- `ts-node-dev`
- `typescript`

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
PORT=8000
MONGO_URI=<your-mongo-connection-string>
JWT_SECRET=<your-jwt-secret>
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
EMAIL_USER=<your-email>
EMAIL_PASS=<your-email-password>
```

> Note: The email service is configured using Gmail in `src/config/mail.ts`, but password reset email sending is currently commented out and the reset code is logged to the console.

## Getting Started

### Clone the repository

```bash
git clone <repository-url>
cd Green-mart-backend
```

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Start built app

```bash
npm run start
```

## Application Startup Flow

1. `src/server.ts` loads environment variables using `dotenv`.
2. It connects to MongoDB via `src/config/db.ts`.
3. It imports and starts the Express app from `src/app.ts`.
4. `src/app.ts` applies security middleware, body parsing, logging, rate limiting, route registration, and global error handling.

## Middleware

### `src/middleware/verify.middleware.ts`

- Verifies JWT from `Authorization: Bearer <token>` header
- Attaches decoded user payload to `req.user`
- Returns `401` if token is missing, invalid, or expired

### `src/middleware/rateLimit.ts`

- `authLimiter` limits auth-related endpoints to 10 requests per 15 minutes

## Models

### `User`

Fields:

- `fullName` (String, required)
- `email` (String, required, unique, lowercase)
- `phoneNumber` (String, required)
- `role` (String, `USER`|`ADMIN`, default `USER`)
- `password` (String, required, minLength 8, excluded by default from queries)
- `passwordResetToken` (String)
- `passwordResetExpires` (Date)

### `Product`

Fields:

- `productName` (String, required)
- `productDescription` (String, required)
- `productPrice` (String, required)
- `ratings` (String, default `0`)
- `productImages` (array of objects with `url` and `publicId`)

Validation:

- product must include 1 to 4 images

### `Cart`

Fields:

- `userId` (ObjectId ref `User`, required)
- `items` (array of `{ productId, quantity }`)

### `Order`

Fields:

- `userId` (ObjectId ref `User`, required)
- `items` (array of `{ productId, quantity, price }`)
- `totalAmount` (Number, required)
- `status` (String enum: `pending`, `paid`, `shipped`, `delivered`, `cancelled`)

### `Favorite`

Fields:

- `userId` (ObjectId ref `User`, required)
- `productId` (ObjectId ref `Product`, required)

Unique index:

- `(userId, productId)` prevents duplicate favorites

## API Endpoints

### Auth Routes (`/api/auth`)

#### `POST /api/auth/register`

- Creates a new user
- Validation via `src/modules/auth/auth.validation.ts`
- Uses `registerUserService`
- Response includes created user and JWT token

Request body:

- `fullName`
- `email`
- `phoneNumber`
- `password`
- `role`

#### `POST /api/auth/login`

- Authenticates an existing user
- Uses `LoginUserService`
- Returns JWT token

Request body:

- `email`
- `password`

#### `POST /api/auth/forgot-password`

- Generates password reset code
- Saves `passwordResetToken` and expiration on the user
- Logs the reset code to console

Request body:

- `email`

#### `POST /api/auth/verify-otp`

- Verifies password reset OTP code
- Checks `email` and `code`
- Returns success when valid and not expired

Request body:

- `email`
- `code`

#### `POST /api/auth/reset-password`

- Resets user password when code is valid
- Hashes `newPassword`
- Clears reset code and expiration

Request body:

- `email`
- `code`
- `newPassword`

### Product Routes (`/api/product`)

All product routes require `Authorization: Bearer <token>`.

#### `POST /api/product/create-products`

- Creates a new product
- Accepts multipart form-data files under `productImages`
- Maximum 4 images
- Uploads images to Cloudinary
- Creates product document with uploaded image URLs

Form-data fields:

- `productName`
- `productDescription`
- `productPrice`
- `ratings` (optional)
- `productImages` files

#### `GET /api/product/get-products`

- Returns paginated product list
- Supports query params:
  - `page` (default 1)
  - `limit` (default 10)
  - `search` (product name, case-insensitive)
  - `sort` (`price_asc`, `price_desc`, `newest`)

#### `GET /api/product/get-single-product/:productId`

- Returns product details for a given `productId`
- Requires valid JWT

Path params:

- `productId`

#### `POST /api/product/add-favorites`

- Adds a product to the authenticated user’s favorites

Request body:

- `productId`

#### `GET /api/product/get-favorites`

- Returns the authenticated user’s favorite products

#### `DELETE /api/product/remove-favorites/:productId`

- Removes a favorite product by `productId`

Path params:

- `productId`

### Cart Routes (`/api/cart`)

All cart routes require `Authorization: Bearer <token>`.

#### `POST /api/cart/add-cart`

- Adds a product to the user cart
- If no cart exists, creates one
- If product already exists, increases quantity

Request body:

- `productId`
- `quantity` (optional, default 1)

#### `GET /api/cart/get-cart`

- Returns the authenticated user’s cart
- Populates `items.productId`

#### `DELETE /api/cart/delete-cart/:productId`

- Removes a product from the cart

Path params:

- `productId`

### Order Routes (`/api/order`)

All order routes require `Authorization: Bearer <token>`.

#### `POST /api/order/create-orders`

- Creates an order from the authenticated user’s cart
- Calculates `totalAmount` from cart items
- Clears cart after order creation

#### `GET /api/order/get-orders`

- Returns all orders for the authenticated user
- Populates `items.productId`

## Controller Function Summary

### `registerUserController`

- Calls `registerUserService`
- Returns created user and JWT

### `loginUserController`

- Calls `LoginUserService`
- Returns JWT

### `forgotPasswordController`

- Finds user by email
- Generates and stores a 5-digit reset token
- Returns success message

### `verifyResetCode`

- Finds user by email and code
- Validates expiration
- Returns verification success

### `resetPassword`

- Finds user by email and code
- Validates expiration
- Hashes and updates password
- Clears reset fields

### `createProductController`

- Validates file uploads
- Converts images to base64 data URIs
- Uploads images to Cloudinary
- Saves product with returned image URLs

### `getProductsController`

- Supports pagination, search, and sorting
- Returns product list and metadata

### `getSingleProduct`

- Fetches product details using `productId`
- Uses authenticated user ID in query

### `addFavorite`

- Creates `Favorite` record for authenticated user

### `getFavorites`

- Returns user favorites with populated products

### `removeFavorites`

- Deletes favorite by `productId`

### `addToCart`

- Finds or creates user cart
- Adds items or increments quantity

### `getCart`

- Retrieves cart with populated product data

### `removeFromCart`

- Removes matching item from user cart

### `createOrder`

- Builds order from cart items
- Computes `totalAmount`
- Clears cart items after order created

### `getUserOrders`

- Returns order history for current user

## Notes

- The project currently logs password reset codes instead of sending actual emails.
- `express-mongo-sanitize` is imported in `src/app.ts`, but the configuration is commented out.
- The authentication middleware expects JWT in `Authorization` header.
- `src/utils/generateToken.ts` issues tokens valid for 1 day.

## Recommended Improvements

- add proper email sending for forgot password flows
- enforce stronger product and cart validation
- handle edge cases in `getSingleProduct`
- add automated tests
- enable database sanitization and stricter error handling

## Quick Commands

```bash
npm install
npm run dev      # development server
npm run build    # compile TypeScript
npm run start    # run compiled production app
```
