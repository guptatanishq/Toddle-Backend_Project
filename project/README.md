# Journal App Backend

A backend service for a classroom journal application with authentication and protected REST and GraphQL endpoints. Teachers can create, update, delete, and publish journals, and students can view journals where they are tagged.

## Features

- JWT-based authentication system
- Role-based authorization (teacher/student)
- REST and GraphQL API endpoints for journal management
- Support for multiple attachment types (image, video, URL, PDF)
- Scheduled publishing with date-time filtering

## Tech Stack

- Node.js
- Express.js
- SQLite (with Sequelize ORM)
- JWT for authentication
- Multer for file uploads

## Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
```

3. Create a `.env` file based on the provided `.env.example`
4. Run the database seed script

```bash
node src/database/seeders/index.js
```

5. Start the server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Authenticate user & get token

### Journals (Protected)

- `POST /api/journals` - Create a new journal (teacher only)
- `PUT /api/journals/:id` - Update a journal (teacher only)
- `DELETE /api/journals/:id` - Delete a journal (teacher only)
- `PUT /api/journals/:id/publish` - Publish a journal (teacher only)
- `GET /api/journals/feed` - Get journal feed (based on user role)
- `GET /api/journals/:id` - Get a single journal

## Database Schema

The application uses SQLite with the following schema:

- **Users** - Stores both teachers and students
- **Journals** - Stores journal entries created by teachers
- **Attachments** - Stores files attached to journals
- **Journal Students** - Junction table for tagging students in journals

See the [ER Diagram](./er-diagram.md) for a visual representation of the database schema.

## Postman: Tagging a Student When Creating a Journal

A dedicated Postman request is included for creating a journal and tagging a specific student by ID. This is useful for testing notification features.

- **Request:** `POST /api/journals`
- **Headers:** `Authorization: Bearer {{token}}`
- **Body (form-data):**
  - `title`: e.g. "Notification Test Journal"
  - `description`: e.g. "This journal is created to test notification for a specific student."
  - `studentIds`: e.g. `[2]` (replace with the actual student ID)
  - `publishedAt`: e.g. `2024-06-01T12:00:00.000Z`

You can use this request in Postman to verify that notifications are triggered for the tagged student.

## License

ISC