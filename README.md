# TaskM — Team Task Manager

TaskM is a full-stack, collaborative project and task management application built with the MERN stack (MongoDB, Express, React, Node.js). It features role-based access control, real-time dashboard analytics, and a modern, responsive UI.

## Features

- **Authentication System:** Secure signup and login using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Project Management:** Create projects and add team members via email.
- **Role-Based Access Control (RBAC):**
  - **Admins** (Project Creators): Can manage project details, add/remove members, and have full CRUD control over tasks.
  - **Members**: Can view project tasks and update the status of tasks assigned to them.
- **Task Tracking:** Create tasks with priorities (Low, Medium, High), statuses (To Do, In Progress, Done), due dates, and assignees.
- **Dashboard Analytics:** View high-level metrics including total projects, open tasks, overdue tasks, and a task status distribution chart.
- **Responsive UI:** Clean, light, and warm design that works seamlessly across desktop, tablet, and mobile devices (includes a mobile bottom navigation bar).

## 🛠 Tech Stack

**Frontend:**
- React 18
- Vite
- React Router v6
- Vanilla CSS (Custom Design System)

**Backend:**
- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Token (JWT)
- Joi (Data Validation)
- bcryptjs

## 📂 Project Structure

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

## ⚙️ Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- A MongoDB database (either local installation or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repository
Ensure you are in the project root directory (`taskm/`).

### 2. Install Dependencies
You need to install dependencies for both the frontend and backend.

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Variables
In the `server/` directory, ensure you have a `.env` file with the following configurations:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_super_secret_jwt_key
```
*(Note: If using MongoDB Atlas, ensure you include the database name in the connection string right before the query parameters, e.g., `...mongodb.net/taskmanager?retryWrites...`)*

### 4. Run the Application
You will need two terminal windows open to run the client and server concurrently.

**Terminal 1: Start the Backend Server**
```bash
cd server
npm run dev
```
*The server will run on http://localhost:5000*

**Terminal 2: Start the Frontend Client**
```bash
cd client
npm run dev
```
*The client will run on http://localhost:5173*

## Usage Example
1. Navigate to `http://localhost:5173`
2. **Sign up** to create an account.
3. Go to the **Projects** tab and click "+ New Project".
4. Open your new project and add tasks using the "+ Add Task" button.
5. Add another registered user to your project via the "+ Add Member" button.
