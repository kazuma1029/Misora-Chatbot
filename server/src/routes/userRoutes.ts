import express from "express";
import { database } from "../database";

const router = express.Router();

// ユーザー情報を取得
router.get("/", (_req, res) => {
  const user = database.getUser();
  res.json({
    userName: user.userName,
  });
});

// ユーザー情報を更新
router.post("/", (req, res) => {
  const { userName } = req.body;
  const updatedUser = database.updateUser({ userName });
  res.json({
    userName: updatedUser.userName,
  });
});

export default router;
