const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { MessageHandler } = require("./classes/MessageHandler");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors({ origin: "*" }));
app.use(express.json());
app.get("/health", (req, res) => res.json({ status: "ok" }));

const handler = new MessageHandler(io);
io.on("connection", socket => handler.handle(socket));

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));