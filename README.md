# Apex Secure Banking System

Apex Secure is a full-stack, professional simulated digital banking platform built with **React (Vite), TypeScript, Tailwind CSS, Recharts**, and **Node.js (Express)**.

Designed for educational audits, security studies, and simulated wire trace validation, this system provides a real-time ledger environment where customers can create accounts, execute secure deposits, withdrawals, and instant wire transfers, while administrators monitor the ledger ecosystem, toggle account active/suspended statuses, and inspect real-time platform audit logs.

---

## 🛠️ Project Architecture Diagram

The application uses a unified full-stack architecture running behind an Nginx reverse-proxy on **Port 3000** for container environments:

```
┌────────────────────────────────────────────────────────┐
│               Client-Side User Interface                │
│             (Vite React SPA + Tailwind CSS)            │
└───────────────────────────┬────────────────────────────┘
                            │
              REST API Requests / JSON Payloads
                            │
┌───────────────────────────▼────────────────────────────┐
│              Server-Side Controller (Node.js)          │
│         (Express.js API Engine + JWT Security)         │
└───────────────────────────┬────────────────────────────┘
                            │
               Read/Write Relational Transactions
                            │
┌───────────────────────────▼────────────────────────────┐
│                Persistent File Database                │
│                (Relational db.json Ledger)             │
└────────────────────────────────────────────────────────┘
```

---

## 📊 Database Relational ER Diagram

```
 +----------------------------------+          +----------------------------------+
 |              USERS               |          |             SESSIONS             |
 +----------------------------------+          +----------------------------------+
 | id (PK)             : varchar    | <------+ | id (PK)             : varchar    |
 | username            : varchar    |          | user_id (FK)        : varchar    |
 | email               : varchar    |          | access_token        : text       |
 | passwordHash        : text       |          | created_at          : timestamp  |
 | isAdmin             : boolean    |          | expires_at          : timestamp  |
 | created_at          : timestamp  |          +----------------------------------+
 | updated_at          : timestamp  |
 +----------------------------------+
   |
   | 1:N
   v
 +----------------------------------+          +----------------------------------+
 |             ACCOUNTS             |          |            AUDIT LOGS            |
 +----------------------------------+          +----------------------------------+
 | id (PK)             : varchar    |          | id (PK)             : varchar    |
 | user_id (FK)        : varchar    |          | user_id (FK/null)   : varchar    |
 | account_number (UK) : varchar    | <------+ | event_type          : varchar    |
 | account_type        : varchar    |   1:N    | description         : text       |
 | balance             : decimal    | (sender) | created_at          : timestamp  |
 | status              : varchar    |          +----------------------------------+
 | created_at          : timestamp  |
 +----------------------------------+
   |                  ^
   | 1:N (receiver)   |
   +---------+--------+
             |
             v
 +----------------------------------+
 |           TRANSACTIONS           |
 +----------------------------------+
 | id (PK)             : varchar    |
 | transaction_id (UK) : varchar    |
 | sender_account      : varchar    | (FK -> Accounts.account_number)
 | receiver_account    : varchar    | (FK -> Accounts.account_number)
 | amount              : decimal    |
 | description         : text       |
 | transaction_type    : varchar    | (deposit, withdraw, transfer)
 | status              : varchar    |
 | created_at          : timestamp  |
 +----------------------------------+
```

---

## 🚀 Installation & Local Running Guide

### Prerequisite Setup
Make sure you have Node.js (v18 or higher) installed on your system.

### 1. Install Dependencies
Run the installation command in your terminal to fetch all client-side and server-side components:
```bash
npm install
```

### 2. Run the Development Server
Launch the unified full-stack dev server using:
```bash
npm run dev
```
The server will boot on `http://localhost:3000`, proxying both API endpoints and the hot Vite static client.

### 3. Production Compilation & Build
To build a production bundle containing esbuild-compiled CommonJS server modules and optimized static assets, run:
```bash
npm run build
```
Start the compiled production container server using:
```bash
npm start
```

---

## 🔒 Security Credentials & Seed Accounts
The ledger comes pre-seeded with multiple bank accounts and 10+ historical transaction charts. You can log in instantly using the helper **Quick-Fill** panel on the login page:

1. **Customer Role** (Savings & Current balances):
   - **Username**: `john_doe`
   - **Password**: `john123`
2. **Administrator Role** (Consolidated platform metrics, status locks):
   - **Username**: `admin`
   - **Password**: `admin123`

---

## 📡 REST API Documentation

### Authentication Endpoints
* **`POST /api/auth/register`**: Register a new customer credential.
* **`POST /api/auth/login`**: Authenticate and retrieve Access JWT + Refresh session.
* **`POST /api/auth/logout`**: Invalidate active tokens.
* **`GET /api/auth/me`**: Fetch current verified session details.
* **`POST /api/auth/update-profile`**: Update email address or change password.

### Account Management Endpoints
* **`POST /api/accounts/create`**: Create a new `savings` or `current` account tier. Generates a unique `APEX-XXXXXXX-SAV/CUR` card number automatically.
* **`GET /api/accounts/my-accounts`**: Retrieve active bank accounts owned by the user.
* **`GET /api/accounts/:id`**: Fetch details for a specific bank ledger.

### Transaction Core Endpoints
* **`POST /api/transactions/deposit`**: Fund a verified ledger (Increases balance).
* **`POST /api/transactions/withdraw`**: Withdraw funds from an active ledger (Validates balance limit).
* **`POST /api/transactions/transfer`**: Transfer wire funds to any recipient account number. (Debits sender, credits receiver, generates completed ledger logs).
* **`GET /api/transactions/history`**: Searchable, paginated audit list with filters (Type, amount range, search terms).

### Administrative Controller Endpoints
* **`GET /api/admin/stats`**: High-level platform total counts and volumes.
* **`GET /api/admin/users`**: List of all registered users in the database.
* **`GET /api/admin/accounts`**: Master ledger listing with **Suspend/Activate** toggle buttons.
* **`GET /api/admin/audit-logs`**: Scrolling, real-time security events trace (logins, transfers, system toggles).
