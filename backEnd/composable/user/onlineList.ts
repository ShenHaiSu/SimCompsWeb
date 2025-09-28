import type {OnlineUser, Session} from "@/composable/user/types"
import { User } from "@/composable/user/types";
import { SessionManager } from "@/composable/user/sessionManager";
import { log2File } from "@/util/tool";

/**
 * 在线用户列表管理器
 * 基于Session管理在线用户状态
 */
export class OnlineListManager {
  private static onlineUsers = new Map<number, OnlineUser>();

  /**
   * 用户上线
   */
  static userOnline(user: User, session: Session, socketId?: string): void {
    const onlineUser: OnlineUser = {
      user: { ...user, password: undefined }, // 不存储密码
      session,
      socketId
    };

    this.onlineUsers.set(user.id, onlineUser);
    log2File(`用户 ${user.name} 已上线（会话：${session.sessionId}）`);
  }

  /**
   * 用户下线
   */
  static userOffline(userId: number): boolean {
    const onlineUser = this.onlineUsers.get(userId);
    if (onlineUser) {
      this.onlineUsers.delete(userId);
      log2File(`用户 ${onlineUser.user.name} 已下线`);
      return true;
    }
    return false;
  }

  /**
   * 检查用户是否在线
   */
  static isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * 获取在线用户信息
   */
  static getOnlineUser(userId: number): OnlineUser | undefined {
    return this.onlineUsers.get(userId);
  }

  /**
   * 获取所有在线用户
   */
  static getAllOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  /**
   * 获取在线用户数量
   */
  static getOnlineUserCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * 更新用户的Socket ID（用于WebSocket连接）
   */
  static updateUserSocketId(userId: number, socketId: string): boolean {
    const onlineUser = this.onlineUsers.get(userId);
    if (onlineUser) {
      onlineUser.socketId = socketId;
      this.onlineUsers.set(userId, onlineUser);
      return true;
    }
    return false;
  }

  /**
   * 根据Socket ID查找用户
   */
  static getUserBySocketId(socketId: string): OnlineUser | undefined {
    for (const onlineUser of this.onlineUsers.values()) {
      if (onlineUser.socketId === socketId) {
        return onlineUser;
      }
    }
    return undefined;
  }

  /**
   * 清理无效的在线用户（Session已过期）
   */
  static cleanupInvalidUsers(): number {
    let cleanedCount = 0;
    const userIdsToRemove: number[] = [];

    for (const [userId, onlineUser] of this.onlineUsers.entries()) {
      // 验证Session是否仍然有效
      const validSession = SessionManager.validateSession(onlineUser.session.sessionId);
      if (!validSession) {
        userIdsToRemove.push(userId);
        cleanedCount++;
      }
    }

    // 移除无效用户
    userIdsToRemove.forEach(userId => {
      this.userOffline(userId);
    });

    if (cleanedCount > 0) {
      log2File(`已清理 ${cleanedCount} 个无效的在线用户`);
    }

    return cleanedCount;
  }

  /**
   * 获取在线用户统计信息
   */
  static getOnlineStats() {
    return {
      totalOnlineUsers: this.getOnlineUserCount(),
      totalSessions: SessionManager.getSessionCount(),
      onlineUsersList: this.getAllOnlineUsers().map(ou => ({
        userId: ou.user.id,
        userName: ou.user.name,
        loginTime: ou.session.loginTime,
        lastActiveTime: ou.session.lastActiveTime,
        ip: ou.session.ip,
        hasSocket: !!ou.socketId
      }))
    };
  }

  /**
   * 清空所有在线用户
   */
  static clear(): void {
    this.onlineUsers.clear();
    log2File("所有在线用户已清空");
  }
}

// 导出单例实例和兼容的Map接口
export const onlineListManager = OnlineListManager;

// 保持向后兼容性
export const onlineList = new Map<number, OnlineUser>();