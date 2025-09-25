import express from "express";

// 创建一个 Express 路由实例
const router = express.Router();

// 引入分支路由
import userRouter from "@router/user.ts";

// 挂载分支路由
router.use("/user", userRouter);

export default router;
