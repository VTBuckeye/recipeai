# RecipeAI - Personal Recipe Management Platform

A comprehensive MERN stack application for creating, managing, and sharing recipes with passwordless authentication, cloud storage, and advanced logging.

## 🚀 Features

- **Passwordless Authentication** - Secure OTP-based email authentication via SuperTokens
- **Recipe Management** - Create, edit, delete, and organize your recipes
- **Advanced Search** - Search by title, description, ingredients, and tags
- **Image Storage** - Upload recipe and profile images to MinIO object storage
- **Public/Private Recipes** - Control recipe visibility
- **Responsive Design** - Mobile and desktop-friendly Material-UI interface
- **Comprehensive Logging** - Application monitoring with Loki and Grafana
- **Print-Friendly Views** - Optimized recipe printing
- **Docker Support** - Full containerization for easy deployment

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- npm or yarn

## 🛠️ Technology Stack

### Frontend
- React 19
- Material-UI (MUI)
- TypeScript
- React Router
- SuperTokens Auth React
- Axios
- Winston (logging)

### Backend
- Node.js
- Express
- TypeScript
- MongoDB
- SuperTokens Node
- MinIO Client
- Winston + Loki (logging)
- Multer (file uploads)

### Infrastructure
- MongoDB 7.0
- PostgreSQL 16 (SuperTokens database)
- SuperTokens Core
- MinIO (S3-compatible object storage)
- Loki (log aggregation)
- Grafana (monitoring dashboards)
- Docker & Docker Compose

## 📦 Installation

### 1. Clone the repository
```bash
cd recipeai
```

### 2. Set up environment variables
```bash
# Root environment
cp .env.example .env

# Server environment
cp server/.env.example server/.env

# Client environment
cp client/.env.example client/.env
```

### 3. Configure environment variables
Edit the `.env` files with your specific configuration values.

### 4. Install dependencies (optional for local development)
```bash
npm install
cd client && npm install
cd ../server && npm install
```

## 🚀 Running the Application

### Using Docker (Recommended)

#### Start all services in development mode:
```bash
npm run docker:dev:up
```

#### Stop all services:
```bash
npm run docker:dev:down
```

#### Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **SuperTokens Dashboard**: http://localhost:3567
- **MinIO Console**: http://localhost:9001
- **Grafana**: http://localhost:3001 (admin/admin)
- **MongoDB**: localhost:27017

### Local Development (Without Docker)

You'll need to run MongoDB, SuperTokens, MinIO, and Loki separately or use Docker for infrastructure only.

#### Terminal 1 - Backend:
```bash
cd server
npm install
npm run dev
```

#### Terminal 2 - Frontend:
```bash
cd client
npm install
npm start
```

## 📁 Project Structure

```
recipeai/
├── client/                      # React frontend
│   ├── public/                  # Static files
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   └── layout/          # Layout components (Navbar, Footer)
│   │   ├── config/              # Configuration files
│   │   ├── pages/               # Page components
│   │   ├── theme/               # Material-UI theme
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utility functions
│   │   └── App.tsx              # Main app component
│   ├── Dockerfile               # Production Dockerfile
│   ├── Dockerfile.dev           # Development Dockerfile
│   └── package.json
├── server/                      # Express backend
│   ├── src/
│   │   ├── config/              # Configuration
│   │   │   ├── database.ts      # MongoDB connection
│   │   │   ├── env.ts           # Environment variables
│   │   │   └── supertokens.ts   # Auth configuration
│   │   ├── controllers/         # Request handlers
│   │   │   ├── recipeController.ts
│   │   │   └── userController.ts
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── logging.ts
│   │   │   └── upload.ts
│   │   ├── models/              # Mongoose models
│   │   │   ├── Recipe.ts
│   │   │   └── User.ts
│   │   ├── routes/              # API routes
│   │   │   ├── recipeRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   └── index.ts
│   │   ├── services/            # Business logic
│   │   │   └── minioService.ts
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utility functions
│   │   │   └── logger.ts
│   │   └── index.ts             # Server entry point
│   ├── Dockerfile               # Production Dockerfile
│   ├── Dockerfile.dev           # Development Dockerfile
│   ├── tsconfig.json
│   └── package.json
├── docker/                      # Docker configurations
│   ├── grafana/
│   │   └── provisioning/        # Grafana datasources
│   ├── loki/
│   │   └── loki-config.yaml     # Loki configuration
│   └── mongodb/
│       └── init-mongo.js        # MongoDB initialization
├── docker-compose.dev.yml       # Development compose file
├── docker-compose.prod.yml      # Production compose file
├── IMPLEMENTATION_STATUS.md     # Detailed implementation status
├── Requirements                 # Project requirements
└── README.md
```

## 🔑 API Endpoints

### Authentication (SuperTokens)
- `POST /auth/signinup/code` - Request OTP code
- `POST /auth/signinup/code/consume` - Verify OTP and sign in
- `POST /auth/signout` - Sign out

### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update user profile
- `POST /api/users/me/profile-picture` - Upload profile picture
- `DELETE /api/users/me` - Delete account

### Recipes
- `GET /api/recipes` - Get user's recipes (paginated)
- `GET /api/recipes/search` - Search public recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create new recipe (with images)
- `PATCH /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `DELETE /api/recipes/:id/images` - Delete specific recipe image

## 📊 Database Schema

### User Document
```typescript
{
  _id: ObjectId,
  email: string (unique),
  name: string,
  supertokensUserId: string (unique),
  profilePictureUrl?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Recipe Document
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: string,
  description: string,
  ingredients: [{
    quantity: number,
    unit: string,
    name: string
  }],
  instructions: [{
    stepNumber: number,
    instruction: string,
    imageUrl?: string
  }],
  tags: string[],
  images: string[],
  isPublic: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Features

- Passwordless authentication (OTP via email)
- Session-based authentication with SuperTokens
- Helmet.js for security headers
- CORS protection
- Rate limiting
- Input validation
- File upload restrictions (type and size)
- Environment-based configuration

## 📝 Configuration

### Key Environment Variables

**Server:**
- `MONGODB_URI` - MongoDB connection string
- `SUPERTOKENS_CONNECTION_URI` - SuperTokens core URL
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - MinIO configuration
- `LOKI_HOST`, `LOKI_PORT` - Loki logging configuration
- `MAX_FILE_SIZE` - Maximum file upload size (default: 1MB)
- `CORS_ORIGIN` - Allowed frontend origin

**Client:**
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_SUPERTOKENS_API_DOMAIN` - SuperTokens API domain
- `REACT_APP_LOKI_HOST` - Loki endpoint for client logging

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 📈 Monitoring

Access Grafana at http://localhost:3001 (default credentials: admin/admin) to:
- View application logs from Loki
- Monitor server and client activities
- Track errors and performance metrics

## 🚢 Deployment

### Production Docker Compose

```bash
# Build and start production services
npm run docker:prod:up

# Stop production services
npm run docker:prod:down
```

### Environment-Specific Notes
- Ensure all sensitive environment variables are properly set
- Use strong passwords for MongoDB, PostgreSQL, and Grafana
- Configure proper SSL certificates for production
- Set up proper backup strategies for MongoDB and PostgreSQL
- Use production-grade MinIO configuration with SSL

## 🛠️ Development

### Adding New Features

1. Backend: Add models, controllers, routes in respective directories
2. Frontend: Create components in appropriate folders
3. Update TypeScript types in both client and server
4. Test locally before committing

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Follow existing patterns and conventions

## 📚 Additional Documentation

- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Detailed implementation status and architecture
- [Requirements](./Requirements) - Original project requirements

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5000, 9000, 9001, 3001, 3567, 27017 are available
2. **MongoDB connection errors**: Check MongoDB container health and credentials
3. **MinIO bucket errors**: Verify MinIO initialization and bucket creation
4. **SuperTokens errors**: Ensure PostgreSQL is running and SuperTokens core is healthy

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for more troubleshooting tips.

## 🤝 Contributing

This is a personal project built according to specific requirements. Feel free to fork and adapt for your needs.

## 📄 License

MIT

## 👏 Acknowledgments

- Built with Create React App
- Authentication powered by SuperTokens
- Storage by MinIO
- Logging by Loki and Grafana
- UI components from Material-UI
