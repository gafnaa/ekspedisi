# Expedisi Project

This project is a Next.js application with a PostgreSQL database managed by Prisma. It's set up for Dockerized development, but can also be run locally without Docker.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Docker](https://www.docker.com/get-started/) and [Docker Compose](https://docs.docker.com/compose/install/) (Required for Docker setup)

## Setup Instructions

Follow these steps to set up the project on your local machine:

### 1. Clone the Repository

```bash
git clone https://github.com/gafnaa/ekspedisi.git
cd ekspedisi
```

### 2. Install Dependencies

Install the project's Node.js dependencies:

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root of the project by copying the `.env.example` file:

```bash
cp .env.example .env
```

Then, edit the `.env` file and replace the placeholder values with your actual PostgreSQL database credentials:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

For example:

```
DATABASE_URL="postgresql://postgres:admin@localhost:5432/buku_ekspedisi"
```

### 4. Prisma Setup

The project uses Prisma for database management.

- **Apply Migrations:** Run the following command to apply the existing database migrations and set up the database schema:

  ```bash
  npx prisma migrate dev --name init
  ```

  (Note: If you encounter issues, you might need to reset the database with `npx prisma migrate reset` and then run the migration command again.)

- **Prisma Studio:** You can use Prisma Studio to view and manage your database data. It's already configured to run via Docker Compose.

### 5. Running the Application

You have two options for running the application locally:

#### Option A: Using Docker Compose (Recommended for consistency)

Start the application and the PostgreSQL database using Docker Compose:

```bash
docker-compose up --build
```

This command will build the Docker image for the application and start the services. The application will be accessible at `http://localhost:3000`.

#### Option B: Running Locally Without Docker

If you prefer not to use Docker, you can run the application directly using npm:

1.  Ensure you have Node.js and npm installed.
2.  Complete steps 1-4 above (Clone, Install Dependencies, Environment Variables, Prisma Setup).
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

## Project Structure

- `app/`: Contains the Next.js application pages and components.
- `prisma/`: Contains Prisma schema and migration files.
- `public/`: Static assets.
- `Dockerfile`: Instructions for building the Docker image for the application.
- `docker-compose.yml`: Defines the Docker services for the application and database.
