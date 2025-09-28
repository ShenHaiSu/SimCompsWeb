// 外部引入
import type { Request, Response, NextFunction } from "express";
import { log2File } from "@util/tool.ts";
import { SessionManager } from "@composable/user/sessionManager.ts";
import { UserUtils } from "@composable/user/userUtils.ts";
import { OnlineListManager } from "@composable/user/onlineList.ts";
import type { User, Session } from "@composable/user/types";

// 扩展Request接口，添加用户信息
declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
    }
  }
}

/**
 * 身份验证中间件
 * 验证用户的Session是否有效，并将用户信息附加到请求对象上
 */
export const authMount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从Cookie或Header中获取sessionId
    const sessionId = req.cookies?.sessionId || (req.headers["x-session-id"] as string);

    if (!sessionId) return next();

    // 验证Session
    const session = SessionManager.validateSession(sessionId);
    if (!session) {
      // Session无效或已过期
      log2File(`Session无效或已过期: ${sessionId}`);

      // 清除客户端的sessionId cookie
      res.clearCookie("sessionId");

      // 短接返回请求
      res.status(401);
      res.json({ success: false, message: "会话已过期，请重新登录", code: "SESSION_EXPIRED" });
      return;
    }

    // 获取用户信息
    const user = await UserUtils.findUserById(session.userId);
    if (!user) {
      // 用户不存在（可能已被删除）
      log2File(`会话用户未找到: ${sessionId}, 用户ID: ${session.userId}`);

      // 删除无效的Session
      SessionManager.deleteSession(sessionId);
      res.clearCookie("sessionId");

      // 不中断路由，继续执行下一个中间件
      return next();
    }

    // 检查用户是否被锁定
    if (user.lock) {
      log2File(`锁定用户尝试访问: ${user.name}`);

      // 删除被锁定用户的所有Session
      SessionManager.deleteUserSessions(user.id);
      OnlineListManager.userOffline(user.id);
      res.clearCookie("sessionId");

      // 不中断路由，继续执行下一个中间件
      return next();
    }

    // 将用户信息和Session信息附加到请求对象
    req.user = user;
    req.session = session;

    // 确保用户在在线列表中
    if (!OnlineListManager.isUserOnline(user.id)) {
      OnlineListManager.userOnline(user, session);
    }

    // 记录访问日志
    // log2File(`已认证请求: ${req.method} ${req.originalUrl} - 用户: ${user.name} (${user.id})`);

    next();
  } catch (error) {
    log2File(`认证中间件错误: ${error}`);

    res.status(500);
    res.json({ success: false, message: "身份验证过程中发生错误", code: "AUTH_ERROR" });
    return;
  }
};
