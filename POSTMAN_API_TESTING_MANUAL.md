# Virtual Classroom API - Postman Testing Manual

## 📋 Table of Contents
1. [Environment Setup](#environment-setup)
2. [Authentication](#authentication)
3. [REST API Endpoints](#rest-api-endpoints)
4. [GraphQL API Endpoints](#graphql-api-endpoints)
5. [Complete Testing Workflows](#complete-testing-workflows)
6. [Postman Collection Import](#postman-collection-import)

---

## 🔧 Environment Setup

### **Postman Environment Variables**
Create a new environment in Postman with these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:4000` | Base URL for all requests |
| `token` | *(leave empty)* | JWT token (will be set after login) |
| `tutorToken` | *(leave empty)* | Tutor JWT token |
| `studentToken` | *(leave empty)* | Student JWT token |

### **Common Headers**
For all authenticated requests, add these headers:
- `Content-Type: application/json`
- `Authorization: Bearer {{token}}`

---

## 🔐 Authentication

### **REST API - Login**

#### **Login as Tutor**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "username": "john_tutor",
  "role": "TUTOR"
}
```
- **Response:** Copy the `token` to your environment variable

#### **Login as Student**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "username": "jane_student",
  "role": "STUDENT"
}
```

### **GraphQL - Login**

#### **Login as Tutor**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/graphql`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "query": "mutation { login(username: \"john_tutor\", role: TUTOR) { token user { id username role } } }"
}
```

#### **Login as Student**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/graphql`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "query": "mutation { login(username: \"jane_student\", role: STUDENT) { token user { id username role } } }"
}
```

---

## 🌐 REST API Endpoints

### **Assignments**

#### **1. Create Assignment (Tutor Only)**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/assignments`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{tutorToken}}`
- **Body:**
```json
{
  "description": "Complete the math homework on algebra",
  "studentIds": [2],
  "publishedAt": "2024-01-15T10:00:00Z",
  "deadline": "2024-01-20T23:59:59Z"
}
```

#### **2. Get Assignment Feed**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/assignments/feed?publishedAt=ONGOING&status=PENDING&page=1&limit=10`
- **Headers:** `Authorization: Bearer {{token}}`
- **Query Parameters:**
  - `publishedAt`: `SCHEDULED` | `ONGOING`
  - `status`: `ALL` | `PENDING` | `OVERDUE` | `SUBMITTED`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10, max: 100)

#### **3. Get Assignment Details**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/assignments/1`
- **Headers:** `Authorization: Bearer {{token}}`

#### **4. Update Assignment (Tutor Only)**
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/assignments/1`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{tutorToken}}`
- **Body:**
```json
{
  "description": "Updated math homework on algebra and geometry",
  "deadline": "2024-01-25T23:59:59Z"
}
```

#### **5. Delete Assignment (Tutor Only)**
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/assignments/1`
- **Headers:** `Authorization: Bearer {{tutorToken}}`

#### **6. Submit Assignment (Student Only)**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/assignments/submit`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{studentToken}}`
- **Body:**
```json
{
  "assignmentId": 1,
  "remark": "I have completed the assignment with all required calculations and explanations."
}
```

#### **7. Grade Assignment (Tutor Only)**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/assignments/grade`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{tutorToken}}`
- **Body:**
```json
{
  "assignmentId": 1,
  "studentId": 2,
  "grade": "A",
  "feedback": "Excellent work! Great understanding of the concepts."
}
```

### **Health Check**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/health`
- **Headers:** None required

---

## 🔍 GraphQL API Endpoints

### **Queries**

#### **1. Get Single Assignment**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/graphql`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body:**
```json
{
  "query": "query { assignment(id: \"1\") { id description publishedAt deadline students { id username } submissions { id remark } } }"
}
```
**Note:** Simplified query structure to match current GraphQL schema implementation.

#### **2. Get Assignment Feed**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/graphql`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body:**
```json
{
  "query": "query { assignmentFeed { assignments { id description publishedAt deadline students { id username } submissions { id remark } } pagination { currentPage totalPages totalItems itemsPerPage } } }"
}
```
**Note:** Current GraphQL schema doesn't support assignment feed query. Use REST API endpoint instead.

#### **3. Get Assignment Feed with Filters**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/graphql`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body:**
```json
{
  "query": "query { assignmentFeed(publishedAt: ONGOING, status: PENDING, page: 1, limit: 10) { assignments { id description publishedAt deadline students { id username } } pagination { currentPage totalPages totalItems } } }"
}
```
**Note:** Current GraphQL schema doesn't support assignment feed query. Use REST API endpoint instead.

### **Mutations**

#### **1. Create Assignment (Tutor Only)**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/graphql`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{tutorToken}}`
- **Body:**
```json
{
  "query": "mutation { createAssignment(description: \"Complete the math homework on algebra\", studentIds: [1], publishedAt: \"2024-01-15T10:00:00Z\", deadline: \"2024-01-20T23:59:59Z\") { id description publishedAt deadline } }"
}
```
**Note:** Use student ID `1` for `jane_student` or omit `studentIds` to assign to all students.

#### **2. Submit Assignment (Student Only)**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/graphql`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{studentToken}}`
- **Body:**
```json
{
  "query": "mutation { submitAssignment(assignmentId: \"1\", remark: \"I have completed the assignment with all required calculations and explanations.\") { id remark } }"
}
```
**Note:** Use simplified query without nested `student` field to avoid GraphQL schema issues.

---

## ✅ Tested Working Commands

### **Verified GraphQL Commands (Tested with curl)**

#### **1. Login as Tutor**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { login(username: \"john_tutor\", role: TUTOR) { token user { id username role } } }"}'
```

#### **2. Create Assignment**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tutor-token>" \
  -d '{"query": "mutation { createAssignment(description: \"Complete the algebra homework\", studentIds: [1], publishedAt: \"2024-01-15T10:00:00Z\", deadline: \"2024-01-20T23:59:59Z\") { id description publishedAt deadline } }"}'
```

#### **3. Login as Student**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { login(username: \"jane_student\", role: STUDENT) { token user { id username role } } }"}'
```

#### **4. Submit Assignment**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student-token>" \
  -d '{"query": "mutation { submitAssignment(assignmentId: \"6\", remark: \"I have completed the homework with all required calculations.\") { id remark } }"}'
```

#### **5. Get Assignment Details**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tutor-token>" \
  -d '{"query": "query { assignment(id: \"6\") { id description publishedAt deadline students { id username } submissions { id remark } } }"}'
```

### **Test Results Summary**
- ✅ **Authentication**: JWT tokens work correctly
- ✅ **Role-based access**: Tutors can create, students can submit
- ✅ **Data persistence**: Database retains data across restarts
- ✅ **Error handling**: Proper authentication errors
- ⚠️ **GraphQL schema**: Some nested fields need updates

---

## 🔄 Complete Testing Workflows

### **Workflow 1: Full Assignment Lifecycle (REST API)**

1. **Login as Tutor**
   - Use REST login endpoint
   - Copy token to `tutorToken` variable

2. **Create Assignment**
   - Use REST create assignment endpoint
   - Note the assignment ID from response

3. **Login as Student**
   - Use REST login endpoint
   - Copy token to `studentToken` variable

4. **Get Assignment Feed (Student)**
   - Use REST get feed endpoint
   - Verify assignment appears

5. **Submit Assignment**
   - Use REST submit endpoint
   - Include assignment ID and remark

6. **Grade Assignment (Back to Tutor)**
   - Use REST grade endpoint
   - Include assignment ID, student ID, grade, and feedback

7. **Get Assignment Details**
   - Use REST get details endpoint
   - Verify submission and grade appear

### **Workflow 2: Full Assignment Lifecycle (GraphQL)**

1. **Login as Tutor**
   - Use GraphQL login mutation
   - Copy token to `tutorToken` variable

2. **Create Assignment**
   - Use GraphQL create assignment mutation
   - Note the assignment ID from response

3. **Login as Student**
   - Use GraphQL login mutation
   - Copy token to `studentToken` variable

4. **Get Assignment Feed**
   - Use GraphQL assignment feed query
   - Verify assignment appears

5. **Submit Assignment**
   - Use GraphQL submit assignment mutation
   - Include assignment ID and remark

6. **Get Assignment Details**
   - Use GraphQL assignment query
   - Verify submission appears

### **Workflow 3: Mixed API Testing**

1. **Login as Tutor (REST)**
2. **Create Assignment (GraphQL)**
3. **Login as Student (GraphQL)**
4. **Submit Assignment (REST)**
5. **Get Assignment Details (GraphQL)**

---

## 📦 Postman Collection Import

### **Collection JSON**
```json
{
  "info": {
    "name": "Virtual Classroom API",
    "description": "Complete API testing collection for Virtual Classroom",
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
    },
    {
      "key": "tutorToken",
      "value": ""
    },
    {
      "key": "studentToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "REST - Login Tutor",
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
              "raw": "{\n  \"username\": \"john_tutor\",\n  \"role\": \"TUTOR\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login"]
            }
          }
        },
        {
          "name": "REST - Login Student",
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
              "raw": "{\n  \"username\": \"jane_student\",\n  \"role\": \"STUDENT\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login"]
            }
          }
        },
        {
          "name": "GraphQL - Login Tutor",
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
              "raw": "{\n  \"query\": \"mutation { login(username: \\\"john_tutor\\\", role: TUTOR) { token user { id username role } } }\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/graphql",
              "host": ["{{baseUrl}}"],
              "path": ["graphql"]
            }
          }
        },
        {
          "name": "GraphQL - Login Student",
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
              "raw": "{\n  \"query\": \"mutation { login(username: \\\"jane_student\\\", role: STUDENT) { token user { id username role } } }\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/graphql",
              "host": ["{{baseUrl}}"],
              "path": ["graphql"]
            }
          }
        }
      ]
    },
    {
      "name": "REST API",
      "item": [
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
                    "value": "Bearer {{tutorToken}}"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"description\": \"Complete the math homework on algebra\",\n  \"studentIds\": [2],\n  \"publishedAt\": \"2024-01-15T10:00:00Z\",\n  \"deadline\": \"2024-01-20T23:59:59Z\"\n}"
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
                  "raw": "{{baseUrl}}/api/assignments/feed?publishedAt=ONGOING&status=PENDING&page=1&limit=10",
                  "host": ["{{baseUrl}}"],
                  "path": ["api", "assignments", "feed"],
                  "query": [
                    {
                      "key": "publishedAt",
                      "value": "ONGOING"
                    },
                    {
                      "key": "status",
                      "value": "PENDING"
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
            },
            {
              "name": "Submit Assignment",
              "request": {
                "method": "POST",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json"
                  },
                  {
                    "key": "Authorization",
                    "value": "Bearer {{studentToken}}"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"assignmentId\": 1,\n  \"remark\": \"I have completed the assignment with all required calculations and explanations.\"\n}"
                },
                "url": {
                  "raw": "{{baseUrl}}/api/assignments/submit",
                  "host": ["{{baseUrl}}"],
                  "path": ["api", "assignments", "submit"]
                }
              }
            }
          ]
        }
      ]
    },
    {
      "name": "GraphQL API",
      "item": [
        {
          "name": "Queries",
          "item": [
            {
              "name": "Get Assignment",
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
                  "raw": "{\n  \"query\": \"query { assignment(id: \\\"1\\\") { id description publishedAt deadline students { id username } submissions { id remark } } }\"\n}"
                },
                "url": {
                  "raw": "{{baseUrl}}/graphql",
                  "host": ["{{baseUrl}}"],
                  "path": ["graphql"]
                }
              }
            },
            {
              "name": "Get Assignment Feed",
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
                  "raw": "{\n  \"query\": \"query { assignmentFeed { assignments { id description publishedAt deadline students { id username } submissions { id remark } } pagination { currentPage totalPages totalItems itemsPerPage } } }\"\n}"
                },
                "url": {
                  "raw": "{{baseUrl}}/graphql",
                  "host": ["{{baseUrl}}"],
                  "path": ["graphql"]
                }
              }
            }
          ]
        },
        {
          "name": "Mutations",
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
                    "value": "Bearer {{tutorToken}}"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"query\": \"mutation { createAssignment(description: \\\"Complete the math homework on algebra\\\", studentIds: [1], publishedAt: \\\"2024-01-15T10:00:00Z\\\", deadline: \\\"2024-01-20T23:59:59Z\\\") { id description publishedAt deadline } }\"\n}"
                },
                "url": {
                  "raw": "{{baseUrl}}/graphql",
                  "host": ["{{baseUrl}}"],
                  "path": ["graphql"]
                }
              }
            },
            {
              "name": "Submit Assignment",
              "request": {
                "method": "POST",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json"
                  },
                  {
                    "key": "Authorization",
                    "value": "Bearer {{studentToken}}"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"query\": \"mutation { submitAssignment(assignmentId: \\\"1\\\", remark: \\\"I have completed the assignment with all required calculations and explanations.\\\") { id remark } }\"\n}"
                },
                "url": {
                  "raw": "{{baseUrl}}/graphql",
                  "host": ["{{baseUrl}}"],
                  "path": ["graphql"]
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🚀 Quick Start Guide

1. **Import the collection** into Postman
2. **Create environment** with the variables listed above
3. **Start your server** (`npm start`)
4. **Run authentication requests** to get tokens
5. **Copy tokens** to environment variables
6. **Test the workflows** step by step

---

## 📝 Notes

- **Server must be running** on `http://localhost:4000`
- **Database persistence** is now enabled (data won't be lost on restart)
- **All authenticated requests** require valid JWT tokens
- **Role-based access** is enforced (tutors can create/grade, students can submit)
- **Both REST and GraphQL** support the same functionality
- **Use environment variables** for tokens to avoid manual copying

---

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. GraphQL Schema Issues**
- **Problem**: `Cannot query field "status" on type "User"`
- **Solution**: Use simplified queries without nested fields
- **Example**: Use `students { id username }` instead of `students { status student { id username } }`

#### **2. Assignment Not Found Error**
- **Problem**: `Assignment not found or you are not assigned to it`
- **Solution**: Ensure assignment is created with `studentIds` parameter
- **Example**: `createAssignment(description: "...", studentIds: [1])`

#### **3. Submission Already Exists**
- **Problem**: `Submission already exists`
- **Solution**: Use a different assignment ID or check existing submissions
- **Note**: This indicates the submission was actually successful

#### **4. Authentication Issues**
- **Problem**: `Authentication required`
- **Solution**: Include valid JWT token in Authorization header
- **Format**: `Authorization: Bearer <your-jwt-token>`

#### **5. Role-based Access**
- **Problem**: `Only tutors can create assignments` or `Only students can submit`
- **Solution**: Use correct user role for the operation
- **Tutor operations**: Create, update, delete, grade assignments
- **Student operations**: Submit assignments, view assignments

### **Debug Steps:**
1. **Check server logs** in terminal for detailed error messages
2. **Verify environment variables** are set correctly
3. **Test with health check** endpoint first: `GET /api/health`
4. **Use GraphQL playground** at `http://localhost:4000/graphql`
5. **Verify user IDs** - `john_tutor` is ID 2, `jane_student` is ID 1

### **Working User IDs:**
- **john_tutor**: ID `2`, Role `TUTOR`
- **jane_student**: ID `1`, Role `STUDENT`

### **Database Persistence:**
- ✅ **Fixed**: Database now retains data across server restarts
- ✅ **No more data loss**: Removed `force: true` from `sequelize.sync()`
