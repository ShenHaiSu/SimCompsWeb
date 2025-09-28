import express from "express";
import { log2File } from "@util/tool";
import type { Request, Response, NextFunction } from "express";

// 创建一个 Express 路由实例
const router = express.Router();

// 引入api路由的全局中间件
import { authMount } from "./middleware/authMount";
router.use(authMount);

// 引入分支路由
import userRouter from "@router/user.ts";

// 挂载分支路由
router.use("/user", userRouter);

// 错误兜底中间件
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log2File(`路由错误: ${err.message}`);
  res.status(500);
  res.json({ success: false, message: "服务器内部错误" });
});

export default router;
