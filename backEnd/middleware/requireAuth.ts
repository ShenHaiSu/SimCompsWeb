import type { Request, Response, NextFunction } from "express";

/**
 * 要求用户必须登录的中间件
 * 如果用户未登录，直接返回401错误
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.session) {
    res.status(401);
    res.json({ success: false, message: "请先登录", code: "LOGIN_REQUIRED" });
    return;
  }
  next();
};