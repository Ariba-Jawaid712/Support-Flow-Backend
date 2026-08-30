# SupportFlow v2.0

> **Smart Customer Support & Service Request Management System**

SupportFlow is an enterprise-ready, role-governed customer support and service request management platform built with Node.js, Express, MongoDB (Mongoose), Socket.IO, and React (Vite).

---

## 🌟 Key Features

1. **Role-Based Architecture & Guarded Workflows**:
   - **Customer**: Submit requests with automatic deterministic AI triage, view real-time request updates, communicate via live chat, and rate resolved requests using a 5-star rating system.
   - **Worker**: Submit registration with *Pending Approval* status. Once approved by Admin, workers can view available tickets, claim requests, manage operational priority (`Low`, `Medium`, `High`, `Critical`, `Urgent`), progress status through a strict one-way state machine, and track dynamic review metrics.
   - **Administrator**: Review, approve, or reject worker registration applications, oversee all global requests, manage customer and worker account activations, and monitor system metrics.

2. **Strict One-Way State Machine**:
   - $\text{Pending} \longrightarrow \text{Accepted} \longrightarrow \text{In Progress} \longrightarrow \text{Resolved}$
   - Or $\text{Pending} \longrightarrow \text{Rejected}$
   - Finalized statuses (`Resolved`, `Rejected`) cannot be changed backwards.

3. **Deterministic Local AI Triage**:
   - Rule-based classifier assessing problem category, initial priority, summary trigger explanation, and confidence score. Zero external API keys or third-party dependencies required.

4. **Real-Time Bidirectional Communication**:
   - Live conversation box with Socket.IO room isolation per ticket.
   - Instant user notifications for approvals, assignments, priority shifts, and status changes.

5. **5-Star Customer Review System**:
   - 1-to-5 star ratings and feedback permitted only for resolved requests by the ticket owner (one review per ticket).
   - Worker profile dynamically calculates true average ratings and review totals.

6. **Password Recovery via 6-Digit OTP**:
   - Secure numeric OTP email delivery, expiration checks (10 min), and bcrypt cryptographic hashing.

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```
*The backend automatically falls back to an in-memory MongoDB instance if a local MongoDB server is not running on port 27017.*

### Default Administrator Credentials:
- **Email**: `admin@supportflow.com`
- **Password**: `AdminPassword123!`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Automated Test Suite
To execute the comprehensive end-to-end integration and regression suite:
```bash
cd backend
npm test
```
