
# 🎟️ Event Ticket Platform

This is a full-stack **event ticketing platform** built to handle real-world event and ticket management scenarios.
The goal of this project was not just to “make something work”, but to design a system that feels **practical, scalable, and close to how production applications are built**.

The repository contains both the **Spring Boot backend** and the **React (Vite + TypeScript) frontend** in a single, well-organized monorepo.

---

## 📁 Project Structure

```
Event-ticket-platform/
├── backend/        # Spring Boot REST API
├── frontend/       # React + Vite + TypeScript UI
├── docker-compose.yml
└── README.md
```

---

## ✨ What This Platform Does

At a high level, the platform allows:

* Event organizers to create, publish, and manage events
* Different ticket types to be created and sold per event
* Users to browse events and purchase tickets
* Tickets to be validated securely using QR codes
* The system to prevent ticket reuse or invalid access

All critical logic is enforced on the backend to ensure **security and data integrity**.

---

## ⚙️ Backend – Spring Boot

The backend is built with **Spring Boot** and acts as the core of the system.
It handles business rules, security, persistence, and all communication with the frontend.

### Core Responsibilities

The backend is responsible for:

* Creating, updating, publishing, and listing events
* Managing ticket types and ticket availability
* Handling ticket purchases and validation
* Generating and validating QR codes
* Authenticating users and securing endpoints
* Returning clean, consistent API responses

---

### Architecture & Design

The backend follows a **layered architecture** commonly used in real-world applications:

* **Controllers**
  Expose REST endpoints and handle HTTP requests and responses.
  Controllers remain lightweight and delegate logic to services.

* **Services**
  Contain the main business logic, such as ticket availability checks, event status rules, and validation workflows.

* **Repositories**
  Use Spring Data JPA to interact with the database, keeping persistence concerns separate from business logic.

* **Entities**
  Represent database tables such as events, tickets, users, and QR codes, with clearly defined relationships.

* **DTOs & Mappers**
  Data Transfer Objects are used to avoid exposing entities directly.
  Mappers convert between entities and DTOs to keep the API stable and clean.

---

### Security & Authentication

Security is implemented using **Spring Security with JWT**:

* Authentication is stateless and token-based
* Protected endpoints require a valid JWT token
* Role-based access control separates admin and user actions
* Custom security filters handle token extraction and validation

This approach makes the backend **scalable, secure, and frontend-friendly**.

---

### Ticketing & QR Code Flow

The backend manages the full lifecycle of a ticket:

1. A user selects an event and ticket type
2. Availability and event status are validated
3. A ticket is created and stored
4. A unique QR code is generated
5. The QR code is validated at entry
6. Ticket status is updated to prevent reuse

All validation happens on the backend to ensure **trust and consistency**.

---

### Error Handling

A centralized exception handling system is used to:

* Catch and process application errors
* Return meaningful error messages
* Avoid leaking internal implementation details
* Keep frontend error handling predictable

---

### Database & Persistence

* Uses **Spring Data JPA**
* Works with PostgreSQL (via Docker)
* Clearly defined entity relationships
* Easy to extend or modify the data model

---

## 🎨 Frontend – React + Vite

The frontend is built with **React, TypeScript, and Vite**, focusing on clarity and usability.

It provides:

* Event browsing and detail views
* Ticket purchasing flows
* Admin-friendly interfaces for managing events
* Type-safe API interactions
* Fast development and hot reload with Vite

The frontend communicates with the backend through secure REST APIs.

---

## ▶️ Running the Project Locally

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Runs on:

```
http://localhost:8080
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on:

```
http://localhost:5173
```

---

## 🐳 Running with Docker (Optional)

The project can also be run using Docker:

```bash
docker-compose up --build
```

This starts the backend, database, and required services together.

---

## 🧪 Testing

Backend tests can be run with:

```bash
cd backend
./mvnw test
```

---

## 🚧 Future Improvements

This platform can be extended with:

* Online payment integration
* Email notifications
* Analytics and reporting dashboards
* Improved admin controls
* CI/CD and cloud deployment

---

## 👋 About the Author

Built by **Tavan Mohammed**
This project reflects my interest in **full-stack development**, **backend architecture**, and building systems that resemble real production applications rather than simple demos.

GitHub: [https://github.com/tavanmohammed](https://github.com/tavanmohammed)

---

## 📄 License

This project is open-source and available under the **MIT License**.



Just tell me — you did a great job getting this far 👏
