# Understand Setup

This project is a full-stack management system built to help a company or organization manage operations in a more structured and efficient way. The main idea is to centralize daily work such as user access, missions, vehicles, incidents, and notifications in one platform, while keeping a clear separation between the different roles in the system.

The application combines a Java Spring Boot backend with an Angular frontend. The backend handles business logic, security, database access, and API endpoints, while the frontend provides the user interface for employees and responsible persons to interact with the system.

## Main idea of the project

The system is designed for internal operational management. In simple terms, it allows users to:

- log in with different roles
- manage missions and assigned tasks
- track vehicles and reservations
- report incidents or problems
- receive notifications in real time
- connect their account with Telegram for quick updates
- access different pages based on permissions

This is not just a basic CRUD project. It is meant to behave like a real business application where roles matter and where actions trigger automatic notifications and approvals.

## Roles and access

The application is built around role-based access.

- Employees can request or manage their own activities.
- Responsible persons can supervise, validate, and monitor operations.
- Some actions are limited depending on user role.

Security is handled with JWT tokens, so users log in and receive a token that authorizes their requests. This prevents unauthorized access to protected endpoints.

## Backend structure

The backend is in the `src/main/java` folder and follows a standard Spring Boot structure.

The main parts are:

- `controllers`: API endpoints for users, missions, vehicles, notifications, incidents, etc.
- `services`: business logic and rules
- `entities`: database models
- `repositories`: database queries and data access
- `security`: JWT authentication and authorization setup
- `websocket`: real-time notifications using WebSockets

The project also includes configuration files, such as application settings and security configuration.

## Frontend structure

The frontend is inside `front-workspace` and uses Angular.

It contains the UI pages for:

- login and authentication
- dashboard
- missions
- vehicles and reservations
- incidents
- notifications
- user management

The frontend communicates with the backend through REST APIs and also supports real-time notifications.

## Main features

Some of the main features already included in this project are:

- user authentication
- role-based access control
- mission management
- vehicle management
- vehicle reservation workflow
- incident reporting
- notifications system
- real-time push notifications
- Telegram link integration
- QR code related functionality

These features are the core of the project and are the parts a person should understand first when exploring the code.

## Database and persistence

The application uses Spring Data JPA and a relational database. The entities represent the main business objects, and the repositories handle database operations.

The database is central to the project, because most of the workflows depend on records such as:

- users
- missions
- vehicles
- reservations
- incidents
- notifications
- Telegram link records

## Real-time communication

The system includes a notification layer based on WebSockets. This allows the app to send updates immediately to connected users without needing full page reloads.

This is important for a modern application where a user should be notified as soon as an event happens, such as a new mission, vehicle approval, or an incident report update.

## Security notes

This project includes important security logic:

- JWT authentication
- password encryption with BCrypt
- protected endpoint restrictions
- role-based access checks

A person looking into the project should know that security is not a side feature here; it is part of the core system architecture.

## Where to start reading the code

If someone wants to understand the project quickly, the best starting points are:

1. `src/main/java/com/projettest/security`  
   This is where authentication, JWT, and access rules are defined.

2. `src/main/java/com/projettest/testing/controllers`  
   This shows what the application actually does from the API side.

3. `src/main/java/com/projettest/testing/entities`  
   This reveals the main database models.

4. `src/main/java/com/projettest/testing/services`  
   This contains the business logic behind the features.

5. `front-workspace/src/app`  
   This is the frontend application and where the user interface lives.

## Important environment information

The project depends on environment values such as secret keys and configuration values. These should not be committed to the repository directly. That is why environment files and secrets must stay local and be handled carefully.

In other words, the code is public, but the sensitive configuration is not.

## How to run the project

The project is divided into backend and frontend.

### Backend

From the root project folder:

```bash
./mvnw spring-boot:run
```

On Windows:

```bash
mvnw.cmd spring-boot:run
```

### Frontend

From the frontend folder:

```bash
cd front-workspace
npm install
npm start
```

The app is meant to run together: backend for APIs and logic, frontend for the interface.

## Final note

This project is a practical internal management application. It is meant to reflect real business operations where information, permissions, and notifications need to move together in a structured system.

The important thing to understand is that the project is not only about a few pages or forms. It is a full workflow system where users, missions, vehicles, incidents, and alerts are all connected.

If someone is looking to understand the architecture, they should focus on the flow between:

- authentication
- role permissions
- business services
- database entities
- notifications
- frontend pages

That is the heart of the project.
