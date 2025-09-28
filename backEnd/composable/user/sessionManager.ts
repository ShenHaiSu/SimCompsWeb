import crypto from "crypto";
import type { Session, User } from "./types";
import { log2File } from "@util/tool.ts";

/**
 * Session管理器
 * 负责Session的创建、验证、删除和清理
 */
export class SessionManager {
  private static sessions = new Map<string, Session>();
  private static readonly SESSION_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时
  private static readonly REMEMBER_ME_EXPIRE_TIME = 30 * 24 * 60 * 60 * 1000; // 30天
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * 初始化Session管理器
   */
  static init() {
    // 启动定期清理过期Session的任务
    this.startCleanupTask();
    log2File("SessionManager 已初始化");
  }

  /**
   * 创建新的Session
   */
  static createSession(user: User, ip: string, userAgent?: string, rememberMe: boolean = false): Session {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    const expiresAt = now + (rememberMe ? this.REMEMBER_ME_EXPIRE_TIME : this.SESSION_EXPIRE_TIME);

    const session: Session = {
      sessionId,
      userId: user.id,
      userName: user.name,
      loginTime: now,
      lastActiveTime: now,
      ip,
      userAgent,
      expiresAt,
    };

    this.sessions.set(sessionId, session);
    log2File(`已创建用户 ${user.name} 的会话 (${sessionId})`);

    return session;
  }

  /**
   * 验证Session是否有效
   */
  static validateSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > session.expiresAt) {
      this.deleteSession(sessionId);
      return null;
    }

    // 更新最后活跃时间
    session.lastActiveTime = Date.now();
    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * 删除Session
   */
  static deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      log2File(`已删除用户 ${session.userName} 的会话 (${sessionId})`);
      return true;
    }
    return false;
  }

  /**
   * 删除用户的所有Session（强制下线）
   */
  static deleteUserSessions(userId: number): number {
    let deletedCount = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      log2File(`已删除 ${deletedCount} 个用户 ${userId} 的会话`);
    }

    return deletedCount;
  }

  /**
   * 获取用户的所有Session
   */
  static getUserSessions(userId: number): Session[] {
    const userSessions: Session[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }

  /**
   * 获取所有在线用户数量
   */
  static getOnlineUserCount(): number {
    const uniqueUsers = new Set<number>();
    for (const session of this.sessions.values()) {
      uniqueUsers.add(session.userId);
    }
    return uniqueUsers.size;
  }

  /**
   * 获取所有Session数量
   */
  static getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 生成唯一的SessionID
   */
  private static generateSessionId(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * 启动定期清理任务
   */
  private static startCleanupTask() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // 每小时清理一次过期Session
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredSessions();
      },
      60 * 60 * 1000
    );
  }

  /**
   * 清理过期的Session
   */
  private static cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      log2File(`已清理 ${cleanedCount} 个过期会话`);
    }
  }

  /**
   * 停止Session管理器
   */
  static destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
    log2File("SessionManager 已销毁");
  }
}

// 导出单例实例
export const sessionManager = SessionManager;
