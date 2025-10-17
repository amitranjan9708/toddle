# Virtual Classroom API

A comprehensive Virtual Classroom API built with Node.js, Express, and GraphQL. This system allows tutors to create and manage assignments while students can submit their work and track their progress.

## 🚀 Features

- **Dual API Support**: Both REST and GraphQL endpoints
- **Role-based Authentication**: JWT-based auth with Tutor/Student roles
- **Assignment Management**: Create, update, delete assignments
- **Submission System**: Students can submit assignments with remarks
- **Advanced Filtering**: Filter assignments by status, publication date
- **Real-time Notifications**: Automated reminders for upcoming deadlines
- **Comprehensive Logging**: Winston-based logging system
- **Input Validation**: Express-validator for request validation
- **Security**: Helmet, CORS, rate limiting, and input sanitization
- **Error Handling**: Global error handling with proper HTTP status codes
- **Database**: SQLite with Sequelize ORM (easily switchable to PostgreSQL/MySQL)

## 📋 Requirements

- Node.js >= 16.0.0
- npm >= 8.0.0

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd virtual-classroom-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # The database will be created automatically on first run
   npm start
   ```

## 🚀 Quick Start

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the API**
   - REST API: `http://localhost:4000/api`
   - GraphQL Playground: `http://localhost:4000/graphql`
   - Health Check: `http://localhost:4000/api/health`

3. **Test Authentication**
   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "john_doe", "role": "TUTOR"}'
   ```

## 📚 API Documentation

Comprehensive API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Key Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User authentication | No |
| POST | `/api/assignments` | Create assignment | Tutor |
| GET | `/api/assignments/feed` | Get assignment feed | Yes |
| GET | `/api/assignments/:id` | Get assignment details | Yes |
| PUT | `/api/assignments/:id` | Update assignment | Tutor |
| DELETE | `/api/assignments/:id` | Delete assignment | Tutor |
| POST | `/api/assignments/submit` | Submit assignment | Student |

## 🏗️ Architecture

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── graphql/         # GraphQL schema and resolvers
├── middleware/      # Custom middleware
├── repositories/    # Database models
├── routes/          # Express routes
├── services/        # Business logic
├── utils/           # Utility functions
├── app.js           # Express app setup
└── server.js        # Server entry point
```

### Key Components

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data processing
- **Repositories**: Database operations and models
- **Middleware**: Authentication, validation, error handling
- **GraphQL**: Schema definitions and resolvers

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Database
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Database Schema

### Entities

- **Users**: Students and Tutors with role-based access
- **Assignments**: Created by tutors, assigned to students
- **AssignmentStudents**: Many-to-many relationship with status tracking
- **Submissions**: Student responses to assignments

### Status Flow

```
SCHEDULED → ONGOING → SUBMITTED
     ↓         ↓
   PENDING   OVERDUE
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Tutor/Student permission system
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against abuse
- **CORS Protection**: Cross-origin request security
- **Helmet.js**: Security headers
- **Input Sanitization**: XSS protection

## 📈 Monitoring & Logging

- **Winston Logger**: Structured logging with multiple transports
- **Morgan**: HTTP request logging
- **Error Tracking**: Global error handling and logging
- **Health Checks**: System status monitoring

## 🚀 Deployment

### Production Checklist

- [ ] Set secure JWT secret
- [ ] Configure production database
- [ ] Set up proper CORS origins
- [ ] Configure logging levels
- [ ] Set up monitoring
- [ ] Enable HTTPS
- [ ] Configure rate limiting

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
- Email: ashish@toddleapp.com
- Documentation: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🎯 Future Enhancements

- [ ] Email notifications
- [ ] File upload support
- [ ] Real-time chat
- [ ] Grade management
- [ ] Analytics dashboard
- [ ] Mobile app support
- [ ] Multi-language support

---

**Built with ❤️ for education**
