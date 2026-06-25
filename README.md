# BookConnect

BookConnect is a social network web application for book readers.
The system allows users to register, log in, create and join reading groups, publish posts with text/images/videos, comment on posts, chat with other users, and view dynamic statistics.

The project was developed as a final project for the Android 2 course.

---

## Technologies

### Client

* React / Next.js
* JavaScript
* CSS3
* D3.js
* Canvas
* Video support

### Server

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Socket.io / WebSockets
* GridFS for image and video storage

---

## Project Architecture

The project follows an MVC-style separation.

### Model

Located in:

```text
server/models
```

Main models:

* User
* Group
* Post
* Message

### Controller

Located in:

```text
server/controllers
```

The controllers contain the main business logic, such as:

* User registration and login
* Group creation and management
* Join requests and approvals
* Post creation, update and delete
* Comments
* Chat messages
* Statistics for graphs

### View

Located in:

```text
my-app/src/app
my-app/src/components
```

The React client contains the pages and UI components that the user interacts with.

### Routes

Located in:

```text
server/routes
```

The route files connect API endpoints to the matching controller functions.

---

## Main Features

* User registration and login
* JWT-based authentication
* User profile view and edit
* User search
* Group creation, update, delete, list and search
* Public and private groups
* Join and leave public groups
* Request to join private groups
* Group owner/admin approval or rejection of join requests
* Group permission management
* Create, update and delete posts
* Posts with text, images and videos
* Comments on posts
* Comment permissions based on group membership
* Feed page with posts from joined groups
* User profile posts
* Private group posts are hidden from non-members
* Real-time chat using Socket.io / WebSockets
* Unread chat message indicators
* Dynamic statistics page using D3.js
* Canvas usage
* CSS3 features: text-shadow, transition, multiple-columns, font-face and border-radius

---

## Folder Structure

```text
BookConnect
│
├── my-app
│   ├── public
│   ├── src
│   │   ├── app
│   │   └── components
│   ├── package.json
│   └── package-lock.json
│
├── server
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── .gitignore
└── README.md
```

---

## Installation and Running the Project

### 1. Clone the repository

```bash
git clone https://github.com/RoniF24/BookConnect.git
```

### 2. Enter the project folder

```bash
cd BookConnect
```

---

## Server Setup

### 1. Enter the server folder

```bash
cd server
```

### 2. Install server dependencies

```bash
npm install
```

### 3. Create environment file

Create a file named:

```text
.env
```

inside the `server` folder.

You can use the existing `.env.example` file as a template.

The `.env` file should contain:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
```

Important:
The real `.env` file is not included in GitHub because it contains sensitive information.

### 4. Run the server

```bash
npm run dev
```

The server should run on:

```text
http://localhost:5000
```

---

## Client Setup

Open a second terminal.

### 1. Enter the client folder

From the main project folder:

```bash
cd my-app
```

### 2. Install client dependencies

```bash
npm install
```

### 3. Run the client

```bash
npm run dev
```

The client should run on:

```text
http://localhost:3000
```

---

## How to Run Both Parts

You need two terminals:

### Terminal 1 — Server

```bash
cd BookConnect/server
npm install
npm run dev
```

### Terminal 2 — Client

```bash
cd BookConnect/my-app
npm install
npm run dev
```

---

## Environment Variables

The server requires the following environment variables:

| Variable   | Description                       |
| ---------- | --------------------------------- |
| PORT       | Server port, usually 5000         |
| MONGO_URI  | MongoDB connection string         |
| JWT_SECRET | Secret key for JWT authentication |

The real values should be stored only in `server/.env`.

---

## Security Notes

The following files and folders are intentionally not uploaded to GitHub:

```text
server/.env
node_modules
my-app/.next
server/uploads
```

This prevents sensitive information and generated files from being committed.

---

## Seed Data

Before presenting the project, the database should include enough data to simulate a real social network, including:

* Several users
* Public and private groups
* Posts in each group
* Comments
* Chat messages
* Pending join requests

This allows the system to demonstrate permissions, feeds, private group behavior, comments, chat and statistics.

---

## Author

Roni Fadlon
