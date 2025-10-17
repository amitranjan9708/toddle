# Virtual Classroom API Documentation

## Overview

This is a comprehensive Virtual Classroom API built with Node.js, Express, and GraphQL. It provides both REST and GraphQL endpoints for managing assignments, submissions, and user authentication.

## Base URL

- **Development**: `http://localhost:4000`
- **GraphQL Playground**: `http://localhost:4000/graphql`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## REST API Endpoints

### 1. Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "role": "TUTOR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "role": "TUTOR"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Assignments

#### Create Assignment (Tutor Only)
```http
POST /api/assignments
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "description": "Complete the math homework on algebra",
  "studentIds": [2, 3, 4],
  "publishedAt": "2024-01-15T10:00:00Z",
  "deadline": "2024-01-20T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "description": "Complete the math homework on algebra",
    "tutorId": 1,
    "publishedAt": "2024-01-15T10:00:00.000Z",
    "deadline": "2024-01-20T23:59:59.000Z",
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-10T08:00:00.000Z"
  }
}
```

#### Update Assignment (Tutor Only)
```http
PUT /api/assignments/1
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "description": "Updated math homework on algebra and geometry",
  "deadline": "2024-01-25T23:59:59Z"
}
```

#### Delete Assignment (Tutor Only)
```http
DELETE /api/assignments/1
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

#### Get Assignment Details
```http
GET /api/assignments/1
Authorization: Bearer <jwt-token>
```

**Response (Tutor):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "description": "Complete the math homework on algebra",
    "tutorId": 1,
    "publishedAt": "2024-01-15T10:00:00.000Z",
    "deadline": "2024-01-20T23:59:59.000Z",
    "students": [
      {
        "id": 2,
        "username": "jane_smith",
        "AssignmentStudent": {
          "status": "SUBMITTED"
        }
      }
    ],
    "Submissions": [
      {
        "id": 1,
        "remark": "I completed the assignment",
        "student": {
          "id": 2,
          "username": "jane_smith"
        }
      }
    ]
  }
}
```

**Response (Student):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "description": "Complete the math homework on algebra",
    "tutorId": 1,
    "publishedAt": "2024-01-15T10:00:00.000Z",
    "deadline": "2024-01-20T23:59:59.000Z",
    "students": [
      {
        "id": 2,
        "username": "jane_smith",
        "AssignmentStudent": {
          "status": "SUBMITTED"
        }
      }
    ],
    "Submissions": [
      {
        "id": 1,
        "remark": "I completed the assignment",
        "student": {
          "id": 2,
          "username": "jane_smith"
        }
      }
    ]
  }
}
```

#### Get Assignment Feed
```http
GET /api/assignments/feed?publishedAt=ONGOING&status=PENDING&page=1&limit=10
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `publishedAt`: `SCHEDULED` | `ONGOING` (optional)
- `status`: `ALL` | `PENDING` | `OVERDUE` | `SUBMITTED` (optional, students only)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": 1,
        "description": "Complete the math homework on algebra",
        "tutorId": 1,
        "publishedAt": "2024-01-15T10:00:00.000Z",
        "deadline": "2024-01-20T23:59:59.000Z",
        "students": [...]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

#### Submit Assignment (Student Only)
```http
POST /api/assignments/submit
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "assignmentId": 1,
  "remark": "I have completed the assignment with all required calculations and explanations."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "remark": "I have completed the assignment with all required calculations and explanations.",
    "studentId": 2,
    "assignmentId": 1,
    "createdAt": "2024-01-18T14:30:00.000Z",
    "updatedAt": "2024-01-18T14:30:00.000Z"
  }
}
```

### 3. Health Check

#### System Health
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-01-10T08:00:00.000Z",
  "environment": "development"
}
```

## GraphQL API

### Schema

```graphql
enum Role {
  TUTOR
  STUDENT
}

type User {
  id: ID!
  username: String!
  role: Role!
}

type Assignment {
  id: ID!
  description: String!
  publishedAt: String
  deadline: String
  students: [User]
  submissions: [Submission]
}

type Submission {
  id: ID!
  remark: String!
  student: User!
}

type AuthPayload {
  token: String!
  user: User!
}

type Query {
  assignment(id: ID!): Assignment
}

type Mutation {
  login(username: String!, role: Role!): AuthPayload
  createAssignment(description: String!, studentIds: [ID], publishedAt: String, deadline: String): Assignment
  submitAssignment(assignmentId: ID!, remark: String!): Submission
}
```

### Example GraphQL Queries

#### Login
```graphql
mutation {
  login(username: "john_doe", role: TUTOR) {
    token
    user {
      id
      username
      role
    }
  }
}
```

#### Create Assignment
```graphql
mutation {
  createAssignment(
    description: "Complete the math homework on algebra"
    studentIds: [2, 3, 4]
    publishedAt: "2024-01-15T10:00:00Z"
    deadline: "2024-01-20T23:59:59Z"
  ) {
    id
    description
    publishedAt
    deadline
  }
}
```


#### Get Assignment
```graphql
query {
  assignment(id: "1") {
    id
    description
    publishedAt
    deadline
    students {
      id
      username
    }
    submissions {
      id
      remark
      student {
        id
        username
      }
    }
  }
}
```

#### Submit Assignment
```graphql
mutation {
  submitAssignment(
    assignmentId: "1"
    remark: "I have completed the assignment with all required calculations."
  ) {
    id
    remark
    student {
      id
      username
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Scope**: All `/api/*` endpoints

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Database Configuration
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Postman Collection

You can import the following Postman collection to test all endpoints:

```json
{
  "info": {
    "name": "Virtual Classroom API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:4000"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"john_doe\",\n  \"role\": \"TUTOR\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Assignments",
      "item": [
        {
          "name": "Create Assignment",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"description\": \"Complete the math homework on algebra\",\n  \"studentIds\": [2, 3, 4],\n  \"publishedAt\": \"2024-01-15T10:00:00Z\",\n  \"deadline\": \"2024-01-20T23:59:59Z\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/assignments",
              "host": ["{{baseUrl}}"],
              "path": ["api", "assignments"]
            }
          }
        },
        {
          "name": "Get Assignment Feed",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/api/assignments/feed?publishedAt=ONGOING&page=1&limit=10",
              "host": ["{{baseUrl}}"],
              "path": ["api", "assignments", "feed"],
              "query": [
                {
                  "key": "publishedAt",
                  "value": "ONGOING"
                },
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "10"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

## Testing

Run the test suite:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Environment Setup

1. Set production environment variables
2. Use a production database (PostgreSQL recommended)
3. Set secure JWT secret
4. Configure CORS for your domain
5. Set up proper logging

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

## Security Features

- JWT-based authentication
- Role-based authorization
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet.js security headers
- SQL injection prevention (Sequelize ORM)
- XSS protection

## Notification System

The system includes a notification service that:
- Runs every 5 minutes
- Checks for assignments due within 24 hours
- Logs reminder notifications
- Can be extended to send emails/SMS

## Database Schema

The system uses the following main entities:
- **Users**: Students and Tutors
- **Assignments**: Created by tutors, assigned to students
- **AssignmentStudents**: Many-to-many relationship with status
- **Submissions**: Student responses to assignments

## Support

For questions or issues, please contact: ashish@toddleapp.com
