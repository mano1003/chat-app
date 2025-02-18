import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

const SECRET = "your_secret_key";
const users = {}; // username -> token
const rooms = {}; // room -> messages

// Authenticate User and Generate Token
app.post("/login", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: "Username required" });

  const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
  users[username] = token;
  res.json({ token, username });
});

// Middleware for Authentication
const authenticate = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, SECRET);
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
};

// Handle WebSockets
io.use(authenticate).on("connection", (socket) => {
  console.log(`User connected: ${socket.username}`);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    socket.emit("chatHistory", rooms[room] || []);
    io.to(room).emit("message", { user: "System", text: `${socket.username} joined.` });
  });

  socket.on("sendMessage", ({ room, message }) => {
    const msg = { user: socket.username, text: message };
    rooms[room] = rooms[room] || [];
    rooms[room].push(msg);
    io.to(room).emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log(`${socket.username} disconnected`);
  });
});
// Run the server
server.listen(4000, () => console.log("Server running on port 4000"));