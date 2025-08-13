import express, { Request, Response } from "express";
import cors from "cors";
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(cors());
app.use(express.json());

// Sample route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express + TypeScript 🚀");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://192.168.100.100:${port}`);
});
