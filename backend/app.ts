const express=require("express");
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import redisClient from "./config/redis";
import TaskBatch from "./models/taskBatch";
import connectDB from "./config/mongoose";
import cors from "cors";
require("dotenv").config();

const app = express();
app.use(express.json());
const server = http.createServer(app);
app.use(cors({ origin: "*" }));

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("add", async (task: any) => {
    const key = "FULLSTACK_TASK_RUPIN";
    try {
      const result = await redisClient.lPush(key, JSON.stringify(task));
      console.log("LPUSH Result:", result);

      const length = await redisClient.lLen(key);
      if (length > 50) {
        const items = await redisClient.lRange(key, 0, -1);
        const parsedItems = items.map((item: string) => JSON.parse(item));

        await new TaskBatch({ items: parsedItems }).save();
        await redisClient.del(key);
      }
      socket.broadcast.emit("newTask", task);
    } catch (err) {
      console.error("Error socket:", err);
      socket.emit("error", { error: "Failed to add task" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.get("/api/fetchAllTasks", async (req:any, res:any) => {
  const key = "FULLSTACK_TASK_RUPIN";
  try {
    const redisItems = await redisClient.lRange(key, 0, -1);
    const parsedRedisItems = redisItems.map((item: string) => JSON.parse(item));

    const batches = await TaskBatch.find().sort({ timestamp: -1 });
    const mongoItems = batches.flatMap((batch) => batch.items);

    const allTasks = [...mongoItems, ...parsedRedisItems];
    res.json(allTasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

let port=process.env.PORT || 8080;
connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error: any) => {
    console.error("Failed to connect to MongoDB", error);
  });
