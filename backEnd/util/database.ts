// #region 描述
// 本文件提供了 SQLite 数据库操作的工具函数，
// 包括数据库的初始化、关闭、执行 SQL 语句（带或不带返回）、
// 查询单条或多条数据，以及预处理语句的管理和执行。
// #endregion

// #region 引入
import sqlite from "sqlite3";
import { log2File } from "#util/tool.ts";
// #endregion

// #region 变量常亮定义
let database: sqlite.Database | null;
const statementSet = new Set<sqlite.Statement>();
// #endregion

// #region 初始化数据库链接
export const initDatabase = (): void => {
  if (database) return;
  database = new sqlite.Database("./dbSet/main.db", (err) => {
    if (err) {
      log2File("数据库连接失败:", err.message);
    } else {
      log2File("数据库连接成功");
    }
  });
};
// #endregion

// #region 断开数据库链接
export const closeDatabase = (): void => {
  if (!database) return;

  database.close((err) => {
    if (err) {
      log2File("数据库关闭失败:", err.message);
    } else {
      log2File("数据库关闭成功");
    }
  });
};
// #endregion

// #region 执行SQL语句
export const run = (sql: string, params: any[] = []): Promise<sqlite.RunResult> => {
  return new Promise((resolve, reject) => {
    if (!database) {
      log2File("数据库未连接");
      return reject(new Error("数据库未连接"));
    }
    database.run(sql, params, function (err) {
      if (err) {
        log2File("数据库执行失败:", err.message);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};
// #endregion

// #region 执行SQL语句 (无返回)
export const exec = (sql: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) {
      log2File("数据库未连接");
      return reject(new Error("数据库未连接"));
    }
    database.exec(sql, (err) => {
      if (err) {
        log2File("数据库执行失败:", err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
// #endregion

// #region 查询单条数据
export const get = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    if (!database) {
      log2File("数据库未连接");
      return reject(new Error("数据库未连接"));
    }
    database.get<T>(sql, params, (err, row) => {
      if (err) {
        log2File("数据库查询失败:", err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};
// #endregion

// #region 查询多条数据
export const query = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    if (!database) {
      log2File("数据库未连接");
      return reject(new Error("数据库未连接"));
    }
    database.all<T>(sql, params, (err, rows) => {
      if (err) {
        log2File("数据库查询失败:", err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};
// #endregion

// #region 创建预处理语句
export const stmtPrepare = (sql: string): Promise<sqlite.Statement> => {
  return new Promise((resolve, reject) => {
    if (!database) {
      log2File("数据库未连接");
      return reject(new Error("数据库未连接"));
    }
    const stmt = database.prepare(sql, function (err) {
      if (err) {
        log2File("预处理语句失败:", err.message);
        reject(err);
      } else {
        statementSet.add(stmt);
        resolve(stmt);
      }
    });
  });
};
// #endregion

// #region 关闭预处理语句
export const stmtClose = (stmt: sqlite.Statement): Promise<void> => {
  return new Promise((resolve, reject) => {
    stmt.finalize((err) => {
      if (err) {
        log2File("关闭预处理语句失败:", err.message);
        reject(err);
      } else {
        statementSet.delete(stmt);
        resolve();
      }
    });
  });
};
// #endregion

// #region 执行预处理语句
export const stmtRun = (stmt: sqlite.Statement, params: any[] = []): Promise<sqlite.RunResult> => {
  return new Promise((resolve, reject) => {
    stmt.run(params, function (err) {
      if (err) {
        log2File("执行预处理语句失败:", err.message);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};
// #endregion

// #region 查询预处理语句单条数据
export const stmtGet = <T>(stmt: sqlite.Statement, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    stmt.get<T>(params, (err, row) => {
      if (err) {
        log2File("查询预处理语句失败:", err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};
// #endregion

// #region 查询预处理语句多条数据
export const stmtQuery = <T>(stmt: sqlite.Statement, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    stmt.all<T>(params, (err, rows) => {
      if (err) {
        log2File("查询预处理语句失败:", err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};
// #endregion
