# TeamCollab Backend

Backend API for the TeamCollab real-time team collaboration platform with project management, task management, team chat, and AI-powered assistant.

## Tech Stack

- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **Socket.IO** - Real-time communication
- **Firebase Admin SDK** - Authentication
- **JWT** - Session management
- **Joi** - Request validation

## Project Structure

```
backend/
├── src/
│   ├── config/         # Database and Firebase configuration
│   ├── controllers/    # Route handlers and business logic
│   ├── middleware/     # Authentication and error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API route definitions
│   ├── validators/     # Joi validation schemas
│   └── index.js        # Application entry point
├── .env.example
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB (local installation or MongoDB Atlas)
- Firebase project with Authentication enabled

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication with Email/Password and Google providers
4. Go to Project Settings → Service Accounts
5. Click "Generate New Private Key" to download the service account JSON file
6. Extract the following values for your `.env`:
   - `project_id`
   - `client_email`
   - `private_key`

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Environment Configuration

Edit `.env` with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/teamcollab
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/teamcollab

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=30d

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKey\n-----END PRIVATE KEY-----\n"

# CORS
FRONTEND_URL=http://localhost:5173
```

**Important**: Replace all placeholder values with your actual credentials.

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |

### Projects

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/projects` | Get all team projects | Yes | All |
| GET | `/api/projects/:id` | Get single project | Yes | All |
| POST | `/api/projects` | Create new project | Yes | Admin/Manager |
| PUT | `/api/projects/:id` | Update project | Yes | Admin/Manager |
| DELETE | `/api/projects/:id` | Delete project | Yes | Admin |

### Tasks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tasks` | Get all tasks | Yes |
| GET | `/api/tasks/:id` | Get single task | Yes |
| POST | `/api/tasks` | Create new task | Yes |
| PUT | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Yes |

### Messages

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/messages` | Get team messages | Yes |
| POST | `/api/messages` | Send message | Yes |

### Team Management

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/team` | Get team information | Yes | All |
| PUT | `/api/team` | Update team settings | Yes | Admin |
| GET | `/api/team/members` | Get team members | Yes | All |
| POST | `/api/team/members` | Add team member | Yes | Admin/Manager |
| PUT | `/api/team/members/:memberId` | Update member role | Yes | Admin |
| DELETE | `/api/team/members/:memberId` | Remove member | Yes | Admin |

### AI Assistant

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/assistant/command` | Process natural language command | Yes |

## User Roles & Permissions

| Permission | Admin | Manager | Member |
|------------|-------|---------|--------|
| View projects | ✅ | ✅ | ✅ |
| Create projects | ✅ | ✅ | ❌ |
| Edit projects | ✅ | ✅ | ❌ |
| Delete projects | ✅ | ❌ | ❌ |
| Manage tasks | ✅ | ✅ | ✅ |
| Add team members | ✅ | ✅ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |

## Real-Time Events (Socket.IO)

The backend emits the following Socket.IO events:

- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `message:new` - New chat message
- `user:typing` - User typing indicator
- `project:updated` - Project updated

## Request/Response Examples

### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe",
  "teamName": "My Team"
}
```

### Create Task

```bash
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement authentication",
  "description": "Add Firebase authentication to the app",
  "status": "todo",
  "priority": "high",
  "projectId": "507f1f77bcf86cd799439011",
  "assignedTo": "507f191e810c19729de860ea"
}
```

### AI Assistant Command

```bash
POST /api/assistant/command
Authorization: Bearer <token>
Content-Type: application/json

{
  "command": "Create a task called 'Fix navigation bug' and assign it to John"
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Scripts

```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
npm test         # Run tests (if configured)
```

### Adding New Routes

1. Create model in `src/models/`
2. Create validator in `src/validators/`
3. Create controller in `src/controllers/`
4. Define routes in `src/routes/`
5. Register routes in `src/index.js`

## Security Considerations

- JWT tokens expire after 30 days (configurable)
- All routes except auth require valid JWT token
- Firebase verifies user authentication
- Role-based access control enforced via middleware
- Input validation using Joi schemas
- MongoDB injection prevention via Mongoose

## License

MIT