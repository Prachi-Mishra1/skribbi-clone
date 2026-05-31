"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const MessageHandler_1 = require("./classes/MessageHandler");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
app.get("/health", (_, res) => res.json({ status: "ok" }));
const handler = new MessageHandler_1.MessageHandler(io);
io.on("connection", socket => handler.handle(socket));
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
