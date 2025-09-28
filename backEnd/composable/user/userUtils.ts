import crypto from "crypto";
import { User } from "./types";
import { get, query } from "@util/database";
import { log2File } from "@util/tool.ts";

/**
 * 用户相关工具函数
 */
export class UserUtils {
  /**
   * 双重MD5加密密码
   * 第一次MD5：原始密码
   * 第二次MD5：第一次结果 + 盐值
   */
  static doubleMD5(password: string, salt: string = "SimCompsWeb"): string {
    const firstMD5 = crypto.createHash("md5").update(password).digest("hex");
    const secondMD5 = crypto
      .createHash("md5")
      .update(firstMD5 + salt)
      .digest("hex");
    return secondMD5;
  }

  /**
   * 验证密码是否正确
   */
  static verifyPassword(inputPassword: string, storedPassword: string, salt: string = "SimCompsWeb"): boolean {
    const hashedInput = this.doubleMD5(inputPassword, salt);
    return hashedInput === storedPassword;
  }

  /**
   * 根据用户名查找用户
   */
  static async findUserByName(username: string): Promise<User | null> {
    try {
      const userData = await get<any>("main.db", "SELECT * FROM user WHERE name = ?", [username]);

      if (!userData) {
        return null;
      }

      return new User(userData);
    } catch (error) {
      log2File(`使用用户名查找用户时出错：${error}`);
      return null;
    }
  }

  /**
   * 根据用户ID查找用户
   */
  static async findUserById(userId: number): Promise<User | null> {
    try {
      const userData = await get<any>("main.db", "SELECT * FROM user WHERE id = ?", [userId]);

      if (!userData) {
        return null;
      }

      return new User(userData);
    } catch (error) {
      log2File(`使用id查找用户时出错：${error}`);
      return null;
    }
  }

  /**
   * 验证用户登录
   */
  static async validateLogin(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.findUserByName(username);

      if (!user) {
        log2File(`登录尝试失败：用户 ${username} 不存在`);
        return null;
      }

      // 检查用户是否被锁定
      if (user.lock) {
        log2File(`登录尝试失败：用户 ${username} 已被锁定`);
        return null;
      }

      // 验证密码
      if (!user.password || !this.verifyPassword(password, user.password)) {
        log2File(`登录尝试失败：用户 ${username} 的密码无效`);
        return null;
      }

      log2File(`用户 ${username} 登录成功`);
      return user;
    } catch (error) {
      log2File(`登录验证过程中出错：${error}`);
      return null;
    }
  }

  /**
   * 创建新用户
   */
  static async createUser(userData: {
    name: string;
    password: string;
    register_ip: string;
    permission_rule?: string;
    permission_node?: string;
  }): Promise<User | null> {
    try {
      const { name, password, register_ip, permission_rule = "user", permission_node = "[]" } = userData;

      // 检查用户名是否已存在
      const existingUser = await this.findUserByName(name);
      if (existingUser) {
        log2File(`用户创建失败：用户名 ${name} 已存在`);
        return null;
      }

      // 加密密码
      const hashedPassword = this.doubleMD5(password);
      const registerTime = new Date().toISOString();

      // 插入用户数据
      const { run } = await import("@util/database");
      const result = await run(
        "main.db",
        `INSERT INTO user (name, password, register_ip, register_time, lock, permission_rule, permission_node) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, hashedPassword, register_ip, registerTime, 0, permission_rule, permission_node]
      );

      if (result.lastID) {
        log2File(`用户 ${name} 成功创建，ID 为 ${result.lastID}`);
        return await this.findUserById(result.lastID as number);
      }

      return null;
    } catch (error) {
      log2File(`创建用户时出错：${error}`);
      return null;
    }
  }

  /**
   * 更新用户最后登录时间
   */
  static async updateLastLogin(userId: number, ip: string): Promise<boolean> {
    try {
      const { run } = await import("@util/database");
      await run("main.db", "UPDATE user SET register_ip = ? WHERE id = ?", [ip, userId]);
      return true;
    } catch (error) {
      log2File(`更新用户 ${userId} 最后登录时间时出错：${error}`);
      return false;
    }
  }

  /**
   * 检查用户权限
   */
  static hasPermission(user: User, permissionKey: string): boolean {
    // 管理员拥有所有权限
    if (user.permission_rule === "admin") return true;
    // 检查具体权限节点
    const permission = user.permission_list.find((p) => p.key === permissionKey);
    return permission ? permission.value : false;
  }

  /**
   * 获取用户显示信息（脱敏）
   */
  static getUserDisplayInfo(user: User) {
    return {
      id: user.id,
      name: user.name,
      register_time: user.register_time,
      permission_rule: user.permission_rule,
      lock: user.lock,
    };
  }

  /**
   * 生成随机盐值
   */
  static generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * 验证用户名格式
   */
  static validateUsername(username: string): { valid: boolean; message?: string } {
    if (!username || username.length < 3) {
      return { valid: false, message: "用户名长度至少3个字符" };
    }

    if (username.length > 20) {
      return { valid: false, message: "用户名长度不能超过20个字符" };
    }

    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return { valid: false, message: "用户名只能包含字母、数字、下划线和中文字符" };
    }

    return { valid: true };
  }

  /**
   * 验证密码强度
   */
  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 6) {
      return { valid: false, message: "密码长度至少6个字符" };
    }

    if (password.length > 50) {
      return { valid: false, message: "密码长度不能超过50个字符" };
    }

    return { valid: true };
  }
}

// 导出单例实例
export const userUtils = UserUtils;
