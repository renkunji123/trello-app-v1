import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import boardsRouter from "./routes/boards.js";
import "./firebase.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);
app.use("/boards", boardsRouter);


app.get("/", (req, res) => res.send("Auth server running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy ở http://localhost:${PORT}`);
});
