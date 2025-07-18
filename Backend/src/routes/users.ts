import express from "express";
import { db } from "@/db/firestoreConfig";

const router = express.Router();

router.get("/users", async (req, res) => {
  try {
    const usersSnapshot = await db.collection("User").get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
