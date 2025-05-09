# Low-Code Database Editor Backend

A powerful backend service for a low-code database editor that supports multiple database types and provides a visual query builder interface.

## Features

- Support for multiple database types:
  - PostgreSQL
  - MySQL
  - SQL Server
  - MongoDB
- Visual query builder
- Real-time database updates using Socket.IO
- JWT authentication
- Database connection management
- Schema inspection
- Query execution and monitoring

## Tech Stack

- **API Layer**: NestJS
- **Database ORMs**: 
  - Sequelize (for SQL databases)
  - Mongoose (for MongoDB)
- **Authentication**: JWT with Passport.js
- **Real-time Events**: Socket.IO
- **Monitoring**: Sentry.io
- **Serverless**: Azure Functions (optional)

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL/MySQL/SQL Server/MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd low-code-sql-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Application
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=low_code_db

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/low_code_db

# JWT Configuration
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=1d

# Sentry Configuration
SENTRY_DSN=your-sentry-dsn
```

4. Start the development server:
```bash
npm run start:dev
```

## API Documentation

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

### Database Connections

- `POST /api/database/connections` - Create a new database connection
- `GET /api/database/connections` - List all database connections
- `GET /api/database/connections/:id` - Get a specific database connection
- `PUT /api/database/connections/:id` - Update a database connection
- `DELETE /api/database/connections/:id` - Delete a database connection

### Query Builder

- `POST /api/query-builder/execute` - Execute a query using the query builder
- `GET /api/query-builder/schema/:connectionId` - Get database schema
- `POST /api/query-builder/test` - Test a query before execution

### WebSocket Events

- `subscribeToDatabase` - Subscribe to database changes
- `unsubscribeFromDatabase` - Unsubscribe from database changes
- `queryExecution` - Execute a query in real-time
- `databaseChange` - Event emitted when database changes occur
- `queryResult` - Event emitted with query execution results

## Development

### Running Tests

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Building for Production

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 