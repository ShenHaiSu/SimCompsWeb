import type { Request, Response, NextFunction } from "express";
import { UserUtils } from "@composable/user/userUtils.ts";

/**
 * 检查特定权限的中间件工厂函数
 */
export const requirePermission = (permissionKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.session) {
      res.status(401);
      res.json({ success: false, message: "请先登录", code: "LOGIN_REQUIRED" });
      return;
    }

    if (!UserUtils.hasPermission(req.user, permissionKey)) {
      res.status(403);
      res.json({ success: false, message: `缺少权限: ${permissionKey}`, code: "PERMISSION_DENIED" });
      return;
    }

    next();
  };
};
