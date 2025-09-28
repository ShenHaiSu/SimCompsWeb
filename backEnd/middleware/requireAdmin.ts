import type { Request, Response, NextFunction } from "express";

/**
 * 要求管理员权限的中间件
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.session) {
    res.status(401);
    res.json({ success: false, message: "请先登录", code: "LOGIN_REQUIRED" });
    return;
  }

  if (req.user.permission_rule !== "admin") {
    res.status(403);
    res.json({ success: false, message: "需要管理员权限", code: "ADMIN_REQUIRED" });
    return;
  }

  next();
};