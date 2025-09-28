import type { Router, Request, Response } from "express";
import type { LoginRequest, LoginResponse } from "@composable/user/types.ts";
import express from "express";
import { SessionManager } from "@composable/user/sessionManager.ts";
import { UserUtils } from "@composable/user/userUtils.ts";
import { onlineListManager } from "@composable/user/onlineList.ts";
import { authMount } from "@middleware/authMount.ts";
import { requireAuth } from "@/middleware/requireAuth";

// 创建路由实例
const router: Router = express.Router();

// #region 用户登录路由
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "用户名和密码不能为空",
      });
    }

    // 验证用户登录
    const user = await UserUtils.validateLogin(username, password);
    if (!user) {
      return res.status(401).json({ success: false, message: "用户名或密码错误" });
    }

    // 检查用户是否被锁定
    if (user.lock) {
      return res.status(403).json({ success: false, message: "账户已被锁定，请联系管理员" });
    }

    // 创建会话
    const sessionData = SessionManager.createSession(user, req.ip || "127.0.0.1", req.get("User-Agent") || "");

    // 设置Cookie
    res.cookie("sessionId", sessionData.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      sameSite: "strict",
    });

    // 更新用户最后登录时间
    await UserUtils.updateLastLogin(user.id, req.ip || "127.0.0.1");

    // 将用户标记为在线
    onlineListManager.userOnline(user, sessionData);

    const response: LoginResponse = {
      success: true,
      message: "登录成功",
      user: {
        id: user.id,
        name: user.name,
        register_time: user.register_time,
        register_ip: user.register_ip,
        permission_rule: user.permission_rule,
        permission_node: user.permission_node,
        permission_list: user.permission_list,
        lock: user.lock,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500);
    res.json({ success: false, message: "服务器内部错误" });
  }
});
// #endregion

// #region 用户注册路由
router.post("/register", async (req, res) => {
  try {
    // TODO: 实现注册逻辑
    res.json({ message: "注册成功" });
  } catch (error) {
    res.status(500).json({ error: "注册失败" });
  }
});
// #endregion

// #region 用户登出路由
router.post("/logout", authMount, async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
      // 删除会话
      SessionManager.deleteSession(sessionId);

      // 将用户标记为离线
      if (req.user) onlineListManager.userOffline(req.user.id);
    }

    // 清除Cookie
    res.clearCookie("sessionId");

    res.json({ success: true, message: "登出成功" });
  } catch (error) {
    console.error("登出错误:", error);
    res.status(500);
    res.json({ success: false, message: "服务器内部错误" });
  }
});
// #endregion

// #region 获取用户信息路由
router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "未登录",
      });
    }

    res.json({
      success: true,
      user: UserUtils.getUserDisplayInfo(req.user),
    });
  } catch (error) {
    console.error("获取用户信息错误:", error);
    res.status(500).json({
      success: false,
      message: "服务器内部错误",
    });
  }
});
// #endregion

// #region 更新用户信息路由
router.put("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "未登录",
      });
    }

    // TODO: 实现更新用户信息逻辑
    // 这里可以根据需要添加具体的更新逻辑
    res.json({
      success: true,
      message: "更新用户信息成功",
    });
  } catch (error) {
    console.error("更新用户信息错误:", error);
    res.status(500).json({
      success: false,
      message: "服务器内部错误",
    });
  }
});
// #endregion

// #region 获取在线用户列表路由（管理员权限）
router.get("/online", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "未登录" });
    }

    // 检查是否有管理员权限
    if (!UserUtils.hasPermission(req.user, "admin")) {
      return res.status(403).json({ success: false, message: "权限不足" });
    }

    const onlineUsers = onlineListManager.getAllOnlineUsers();
    const stats = onlineListManager.getOnlineStats();

    req.user;

    res.json({
      success: true,
      data: {
        users: onlineUsers,
        stats: stats,
      },
    });
  } catch (error) {
    console.error("获取在线用户列表错误:", error);
    res.status(500).json({
      success: false,
      message: "服务器内部错误",
    });
  }
});
// #endregion

export default router;
