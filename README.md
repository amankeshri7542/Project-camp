# Project Camp

A full-stack project management web application built with Node.js, Express, MongoDB, and a glassmorphic React frontend. Manage projects, assign tasks, track progress, and collaborate with your team — all from a single page.

**Live Demo:** https://project-camp-2sp3.onrender.com
**Repository:** https://github.com/amankeshri7542/Project-camp

---

## Screenshots

**Dashboard** — glassmorphic stats overview with project table and live status badges:

![Dashboard](public/images/SCR-20260606-cbbe.jpeg)

**Profile** — user profile management with edit form and account settings:

![Profile](public/images/SCR-20260606-cbng.jpeg)

---

## Features

- **Auth** — Register, login, logout with JWT + httpOnly cookies. Email verification and forgot-password flow.
- **Projects** — Create, update, delete projects. Invite team members by email.
- **Roles** — Three-tier access control: `admin` (owner), `project_admin`, `member`.
- **Tasks** — Full task CRUD with file attachments (up to 5 files, 1 MB each). Status: `todo`, `in_progress`, `done`.
- **Subtasks** — Nested subtasks with completion toggle under each task.
- **Notes** — Project-level notes for admins and project admins.
- **Glassmorphic UI** — Single-page React app with Apple-style frosted glass design, animated aurora background, fully responsive with mobile bottom navigation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 (ESM) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens), bcrypt |
| File uploads | Multer (disk storage) |
| Validation | express-validator |
| Email | Nodemailer + Mailgen |
| Frontend | React 18 (CDN), Babel standalone |
| Container | Docker (node:20-alpine) |

---

## Local Setup (Without Docker)

### Prerequisites

- Node.js 20+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com) free tier)
- Git

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/amankeshri7542/Project-camp.git
cd Project-camp

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/project-camp
ACCESS_TOKEN_SECRET=your_super_secret_access_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key_here
ACCESS_TOKEN_EXPIRE=1d
REFRESH_TOKEN_EXPIRE=10d
NODE_ENV=development
CORS_ORIGINS=http://localhost:8000
SERVER_URL=http://localhost:8000

# Optional — for email verification and password reset
MAILER_HOST=smtp.gmail.com
MAILER_PORT=587
MAILER_USER=your@gmail.com
MAILER_PASS=your_app_password
```

```bash
# 4. Start the dev server (auto-restarts on file change)
npm run dev

# Or start normally
npm start
```

Open **http://localhost:8000** in your browser.

---

## Local Setup (With Docker)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Build and run

```bash
# 1. Clone the repo
git clone https://github.com/amankeshri7542/Project-camp.git
cd Project-camp

# 2. Build the Docker image
docker build -t project-camp .

# 3. Run the container
docker run -d \
  -p 8000:8000 \
  -e PORT=8000 \
  -e MONGO_URI="mongodb+srv://youruser:yourpass@cluster.mongodb.net/project-camp" \
  -e ACCESS_TOKEN_SECRET="your_access_secret" \
  -e REFRESH_TOKEN_SECRET="your_refresh_secret" \
  -e ACCESS_TOKEN_EXPIRE="1d" \
  -e REFRESH_TOKEN_EXPIRE="10d" \
  -e NODE_ENV="production" \
  -e CORS_ORIGINS="http://localhost:8000" \
  -e SERVER_URL="http://localhost:8000" \
  --name project-camp \
  project-camp
```

Open **http://localhost:8000**.

### Useful Docker commands

```bash
# View logs
docker logs -f project-camp

# Stop the container
docker stop project-camp

# Remove the container
docker rm project-camp

# Rebuild after code changes
docker build -t project-camp . && docker run ...
```

> **Note:** Use MongoDB Atlas (cloud) for the `MONGO_URI` when running in Docker — connecting to `localhost` inside a container won't reach your host machine's MongoDB.

---

## Deploy to Render (Free Hosting)

This gets you a live public URL in about 5 minutes.

### Step 1 — Push to GitHub

Make sure your code is pushed:
```bash
git push origin master
```

### Step 2 — Create a Render account

Go to [render.com](https://render.com) and sign up (free).

### Step 3 — Create a new Web Service

1. Click **New → Web Service**
2. Connect your GitHub account and select the `Project-camp` repo
3. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `project-camp` |
| **Region** | Any (pick closest to you) |
| **Branch** | `master` |
| **Runtime** | **Docker** |
| **Instance Type** | Free |

Render auto-detects the `Dockerfile` in the root.

### Step 4 — Add Environment Variables

In the Render dashboard under **Environment**, add these:

| Key | Value |
|---|---|
| `PORT` | `8000` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `ACCESS_TOKEN_SECRET` | Any long random string (min 32 chars) |
| `REFRESH_TOKEN_SECRET` | Any different long random string |
| `ACCESS_TOKEN_EXPIRE` | `1d` |
| `REFRESH_TOKEN_EXPIRE` | `10d` |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | `https://your-app.onrender.com` (fill after deploy) |
| `SERVER_URL` | `https://your-app.onrender.com` (fill after deploy) |
| `MAILER_HOST` | `smtp.gmail.com` (optional) |
| `MAILER_PORT` | `587` (optional) |
| `MAILER_USER` | your Gmail (optional) |
| `MAILER_PASS` | Gmail app password (optional) |

### Step 5 — Deploy

Click **Create Web Service**. Render will build the Docker image and deploy it. Takes ~3-5 minutes.

Once the status shows **Live**, your app is available at:
```
https://project-camp.onrender.com
```
(or whatever name you chose)

Copy that URL and update `CORS_ORIGINS` and `SERVER_URL` to match it.

### MongoDB Atlas setup (if you don't have it)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → free tier → create cluster
2. Database Access → Add user with password
3. Network Access → Add IP `0.0.0.0/0` (allow from anywhere — needed for Render)
4. Connect → Drivers → copy the connection string, replace `<password>` with your password

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login, sets cookies |
| POST | `/auth/logout` | Yes | Clear cookies |
| GET | `/auth/current-user` | Yes | Get logged-in user |
| GET | `/auth/verify-email/:token` | No | Verify email |
| POST | `/auth/forgot-password` | No | Send reset email |
| POST | `/auth/reset-password/:token` | No | Reset password |
| POST | `/auth/change-password` | Yes | Change password |
| POST | `/auth/refresh-token` | No | Refresh access token |

### Projects

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/projects` | Any | List your projects |
| POST | `/projects` | Any | Create project |
| GET | `/projects/:id` | Member+ | Get project details |
| PUT | `/projects/:id` | Admin | Update project |
| DELETE | `/projects/:id` | Admin | Delete project |
| GET | `/projects/:id/members` | Member+ | List members |
| POST | `/projects/:id/members` | Admin | Add member by email |
| PUT | `/projects/:id/members/:userId` | Admin | Update member role |
| DELETE | `/projects/:id/members/:userId` | Admin | Remove member |

### Tasks

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/projects/:id/tasks` | Member+ | List tasks |
| POST | `/projects/:id/tasks` | Member+ | Create task (multipart) |
| GET | `/projects/:id/tasks/:taskId` | Member+ | Get task details |
| PUT | `/projects/:id/tasks/:taskId` | Admin/PA | Update task |
| DELETE | `/projects/:id/tasks/:taskId` | Admin/PA | Delete task + subtasks |
| POST | `/projects/:id/tasks/:taskId/subtasks` | Member+ | Add subtask |
| PUT | `/projects/:id/tasks/subtasks/:subId` | Member+ | Update subtask |
| DELETE | `/projects/:id/tasks/subtasks/:subId` | Member+ | Delete subtask |

### Notes

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/projects/:id/notes` | Member+ | List notes |
| POST | `/projects/:id/notes` | Admin/PA | Create note |
| GET | `/projects/:id/notes/:noteId` | Member+ | Get note |
| PUT | `/projects/:id/notes/:noteId` | Admin/PA | Update note |
| DELETE | `/projects/:id/notes/:noteId` | Admin/PA | Delete note |

**Roles:** `admin` (project owner) > `project_admin` > `member`

---

## Testing the App

### Manual testing checklist

#### Auth flows
```
[ ] Register a new account
[ ] Check email verification (if MAILER configured) or skip
[ ] Login → dashboard loads
[ ] Refresh the page → stays logged in (cookie persists)
[ ] Logout → redirected to landing
[ ] Try accessing /dashboard URL directly when logged out → redirected
[ ] Forgot password flow (needs MAILER env vars)
```

#### Projects
```
[ ] Create a project with status "In Progress"
[ ] Verify the correct status badge shows
[ ] Edit the project name/description
[ ] Change project status → badge updates
[ ] Create a second account, add them as member by email
[ ] Login as second user → project appears in their list
[ ] As second user (member), try to delete project → should be blocked
[ ] Delete a project → disappears from list
```

#### Tasks
```
[ ] Open a project → create a task
[ ] Assign task to a team member
[ ] Change task status from TODO → In Progress → Done
[ ] Attach a file (under 1 MB) to a task
[ ] Add a subtask, check it off
[ ] Delete a task → subtasks also deleted
```

#### Notes
```
[ ] Create a project note as admin
[ ] Read note as member (read-only)
[ ] Edit/delete as admin
[ ] Try to create note as member → should be blocked
```

#### Mobile
```
[ ] Open on phone or resize browser to under 768px
[ ] Bottom nav appears
[ ] Hamburger opens sidebar drawer
[ ] All screens usable with thumb navigation
```

### API testing with curl

```bash
BASE=http://localhost:8000/api/v1

# Register
curl -c cookies.txt -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test@1234","fullName":"Test User"}'

# Login
curl -c cookies.txt -b cookies.txt -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'

# Get current user
curl -b cookies.txt $BASE/auth/current-user

# Create project
curl -b cookies.txt -X POST $BASE/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"My Project","description":"Testing","status":"in_progress"}'

# List projects
curl -b cookies.txt $BASE/projects
```

### API testing with Postman / Thunder Client

1. Import the base URL `http://localhost:8000/api/v1`
2. In collection settings → turn on **"Send cookies"**
3. Hit Login first — cookies are saved automatically
4. All subsequent requests will be authenticated

---

## Assumptions & Limitations

### Assumptions

- **Single-page app served by Express** — the frontend (`public/index.html`) is served as a static file from the same Express server. No separate frontend build step needed.
- **Email verification is optional** — the app works without MAILER credentials. Email-related features (verify email, forgot password) will fail gracefully if MAILER is not configured.
- **File uploads stored locally** — attachments are saved to `public/images/` on the server. On Render's free tier, this storage is ephemeral (resets on redeploy). For persistent uploads, integrate Cloudinary or AWS S3.
- **Priority is UI-only** — task priority (low/medium/high) is managed in the frontend state only and is not persisted to the database. It resets on page refresh.
- **Single timezone** — dates are stored in UTC. No per-user timezone conversion is applied.

### Limitations

- **No real-time updates** — the app does not use WebSockets or SSE. Team members won't see each other's changes live; a page refresh is needed.
- **File storage is ephemeral on free hosting** — Render's free tier has no persistent disk. Uploaded files will not survive a redeploy or restart.
- **No pagination** — all projects and tasks are fetched in a single query. Performance may degrade with very large datasets (100+ projects or 1000+ tasks).
- **Email not required for testing** — verification emails won't send unless MAILER credentials are configured. All other features work without it.
- **No OAuth** — authentication is username/password only. Google/GitHub login is not implemented.
- **Free Render tier spins down** — on the free plan, the service sleeps after 15 minutes of inactivity. The first request after sleep may take 30-60 seconds to respond.

---

## Project Structure

```
project-camp/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js       # register, login, logout, email verify
│   │   ├── project.controller.js    # project + member CRUD
│   │   ├── task.controller.js       # task + subtask CRUD
│   │   └── note.controller.js       # project notes CRUD
│   ├── models/
│   │   ├── user.models.js
│   │   ├── project.models.js
│   │   ├── projectMember.models.js
│   │   ├── task.models.js
│   │   ├── subtask.models.js
│   │   └── note.models.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── project.routes.js
│   │   ├── task.routes.js           # mergeParams: true
│   │   └── note.routes.js           # mergeParams: true
│   ├── middlewares/
│   │   ├── auth.middleware.js        # verifyJWT + validateProjectPermission
│   │   ├── multer.middleware.js      # file upload config
│   │   └── validator.middleware.js   # express-validator error handler
│   ├── validators/
│   │   └── index.js                  # all validation chains
│   ├── utils/
│   │   ├── constants.js
│   │   ├── api-error.js
│   │   ├── api-response.js
│   │   └── async-handler.js
│   ├── app.js                        # Express setup, route mounting
│   ├── db.js                         # MongoDB connection
│   └── index.js                      # Entry point
├── public/
│   ├── index.html                    # React SPA (CDN, glassmorphic UI)
│   └── images/                       # Uploaded file storage
├── Dockerfile
├── .dockerignore
├── .env.example
└── package.json
```

---

## .env.example

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/project-camp
ACCESS_TOKEN_SECRET=change_this_to_a_long_random_string
REFRESH_TOKEN_SECRET=change_this_to_another_long_random_string
ACCESS_TOKEN_EXPIRE=1d
REFRESH_TOKEN_EXPIRE=10d
NODE_ENV=development
CORS_ORIGINS=http://localhost:8000
SERVER_URL=http://localhost:8000
MAILER_HOST=smtp.gmail.com
MAILER_PORT=587
MAILER_USER=
MAILER_PASS=
```

---

## License

MIT
