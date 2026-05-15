# TaskM — Team Task Manager

TaskM is a full-stack, collaborative project and task management application featuring role-based access control, real-time dashboard analytics, and a modern, responsive UI.

## Features

- **Authentication System:** Secure signup and login using JWT.
- **Project Management:** Create projects and add team members.
- **Role-Based Access Control:**
  - **Admins:** Full control over project details, members, and tasks.
  - **Members:** View tasks and update status for assigned tasks.
- **Task Tracking:** Manage tasks with priorities, statuses, due dates, and descriptions.
- **Dashboard Analytics:** High-level metrics and task status distribution charts.
- **Responsive UI:** Clean design optimized for desktop and mobile devices.

## Tech Stack

**Frontend:**
- React 18
- Vite
- React Router v6
- Vanilla CSS

**Backend:**
- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Token (JWT)
- Joi (Data Validation)
- bcryptjs

## Project Structure

```
taskm/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components (Navbar, Modal)
│   │   ├── context/        # React Context API (Auth state)
│   │   ├── pages/          # Application views (Dashboard, Projects, Auth)
│   │   ├── services/       # API integration logic
│   │   ├── App.jsx         # Routing configuration
│   │   └── index.css       # Global design system & styles
│   └── vite.config.js      # Vite config with API proxy
│
└── server/                 # Express Backend
    ├── config/             # Database connection logic
    ├── middleware/         # Auth & RBAC guards
    ├── models/             # Mongoose schemas (User, Project, Task)
    ├── routes/             # RESTful API endpoints
    ├── server.js           # Server entry point
    └── .env                # Environment variables
```

### Environment Variables
In the `server/` directory, ensure you have a `.env` file with the following configurations:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_token
```

## Usage Example
1. Navigate to `http://localhost:5173`
2. **Sign up** to create an account.
3. Go to the **Projects** tab and click "+ New Project".
4. Open your new project and add tasks using the "+ Add Task" button.
5. Add another registered user to your project via the "+ Add Member" button.
