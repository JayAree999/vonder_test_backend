# Transaction Management Backend

This is the backend for a **Transaction Management System**. It provides a RESTful API for managing financial transactions, including creating, retrieving, updating, and deleting transactions, as well as calculating balances and exporting data.
To see api docs : 
```
http://localhost:$PORT/api-docs
```

---

## Objective

The objective of this backend is to provide a robust and scalable API for managing financial transactions. It allows users to:

- Add new transactions (income or expense).
- Retrieve all transactions or filter them by date and type.
- Calculate the total balance based on all transactions.
- Export transactions to a CSV file for reporting.

---

## How to Launch the Backend

### Prerequisites

Before running the backend, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB Atlas account** or a local MongoDB instance

### Installation

1. Clone the repository:
2. Install dependencies: npm install
3. Set up environment variables:

Create a .env file in the root directory.

Add the following variables:
```
MONGO_USERNAME=your_mongodb_username
MONGO_PASSWORD=your_mongodb_password
PORT=3000
CORS_ORIGIN=http://localhost:3000
```
4. Start the server:
```
npm start
```
