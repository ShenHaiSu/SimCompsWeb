// #region 描述
// 本文件提供了 SQLite 数据库操作的工具函数，
// 包括数据库的初始化、关闭、执行 SQL 语句（带或不带返回）、
// 查询单条或多条数据，以及预处理语句的管理和执行。
// #endregion

// #region 引入
import sqlite from "sqlite3";
import fs from "node:fs";
import { log2File } from "@util/tool.ts";
// #endregion

// #region 变量常亮定义
const databaseDir = `./dbSet`;
const databaseMap = new Map<string, sqlite.Database>();
const databaseStmtMap = new Map<string, Symbol[]>();
const statementMap = new Map<Symbol, sqlite.Statement>();
// #endregion

// #region 初始化数据库链接
/**
 * 初始化数据库连接
 * @description 创建或获取指定名称的SQLite数据库连接，如果数据库不存在会自动创建
 * @param {string} dbName - 数据库文件名称（不包含路径）
 * @returns {sqlite.Database} 数据库连接实例
 * @example
 * const db = initDatabase('main.db');
 */
export const initDatabase = (dbName: string): sqlite.Database => {
  // 提前创建数据库存放路径
  fs.mkdirSync(databaseDir, { recursive: true });

  // 检查是否已经存在
  const targetDatabase = databaseMap.get(dbName);
  if (targetDatabase) return targetDatabase;

  // 链接不存在，现场创建并返回
  const db = new sqlite.Database(`${databaseDir}/${dbName}`, (err) => {
    if (err) {
      log2File("数据库连接失败:", err.message);
    } else {
      log2File("数据库连接成功");
    }
  });
  // 加入到数据库列表
  databaseMap.set(dbName, db);
  return db;
};
// #endregion

// #region 断开数据库链接
/**
 * 关闭指定数据库连接
 * @description 关闭指定名称的数据库连接，并清理相关的预处理语句
 * @param {string} dbName - 要关闭的数据库名称
 * @returns {Promise<void>} 异步操作Promise
 * @example
 * await closeDatabase('main.db');
 */
export const closeDatabase = async (dbName: string): Promise<void> => {
  const db = databaseMap.get(dbName);
  if (!db) return log2File(`数据库 ${dbName} 未连接`);

  // 取出对应的Statement
  const dbStmtList = databaseStmtMap.get(dbName) || [];

  // 逐个结束Statement
  for (const stmtKey of dbStmtList) {
    await stmtClose(stmtKey, dbName);
  }

  db.close((err) => {
    if (err) {
      log2File(`数据库 ${dbName} 关闭失败:`, err.message);
    } else {
      log2File(`数据库 ${dbName} 关闭成功`);
      databaseMap.delete(dbName);
    }
  });
};
// #endregion

// #region 断开所有数据库链接
/**
 * 关闭所有数据库连接
 * @description 关闭当前已连接的所有数据库，并清理相关资源
 * @returns {Promise<void>} 异步操作Promise
 * @example
 * await closeAllDatabases();
 */
export const closeAllDatabases = async (): Promise<void> => {
  // 生成数据库名称列表
  const dbNameList = [...databaseMap.keys()];
  // 逐一发起关闭
  for (const dbName of dbNameList) {
    await closeDatabase(dbName);
  }
};
// #endregion

// #region 执行SQL语句
/**
 * 执行SQL语句（INSERT、UPDATE、DELETE等）
 * @description 执行带参数的SQL语句，返回执行结果信息
 * @param {string} dbName - 数据库名称
 * @param {string} sql - 要执行的SQL语句
 * @param {any[]} params - SQL参数数组，默认为空数组
 * @returns {Promise<sqlite.RunResult>} 包含lastID、changes等信息的执行结果
 * @example
 * const result = await run('main.db', 'INSERT INTO users (name, email) VALUES (?, ?)', ['张三', 'zhangsan@example.com']);
 * console.log(result.lastID); // 新插入记录的ID
 */
export const run = (
  dbName: string,
  sql: string,
  params: any[] = []
): Promise<sqlite.RunResult> => {
  return new Promise((resolve, reject) => {
    const db = initDatabase(dbName);
    db.run(sql, params, function (err) {
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

// #region 执行SQL语句 (无返回，无参数)
/**
 * 执行SQL语句（无参数，无返回值）
 * @description 执行不需要参数的SQL语句，如CREATE TABLE、DROP TABLE等DDL语句
 * @param {string} dbName - 数据库名称
 * @param {string} sql - 要执行的SQL语句
 * @returns {Promise<void>} 异步操作Promise
 * @example
 * await exec('main.db', 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)');
 */
export const exec = (dbName: string, sql: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = initDatabase(dbName);
    db.exec(sql, (err) => {
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
/**
 * 查询单条数据
 * @description 执行SELECT查询并返回第一条匹配的记录
 * @template T - 返回数据的类型
 * @param {string} dbName - 数据库名称
 * @param {string} sql - 查询SQL语句
 * @param {any[]} params - SQL参数数组，默认为空数组
 * @returns {Promise<T | undefined>} 查询结果，如果没有找到记录则返回undefined
 * @example
 * interface User { id: number; name: string; email: string; }
 * const user = await get<User>('main.db', 'SELECT * FROM users WHERE id = ?', [1]);
 */
export const get = <T>(
  dbName: string,
  sql: string,
  params: any[] = []
): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    const db = initDatabase(dbName);
    db.get<T>(sql, params, (err, row) => {
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
/**
 * 查询多条数据
 * @description 执行SELECT查询并返回所有匹配的记录
 * @template T - 返回数据的类型
 * @param {string} dbName - 数据库名称
 * @param {string} sql - 查询SQL语句
 * @param {any[]} params - SQL参数数组，默认为空数组
 * @returns {Promise<T[]>} 查询结果数组，如果没有找到记录则返回空数组
 * @example
 * interface User { id: number; name: string; email: string; }
 * const users = await query<User>('main.db', 'SELECT * FROM users WHERE age > ?', [18]);
 */
export const query = <T>(
  dbName: string,
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const db = initDatabase(dbName);
    db.all<T>(sql, params, (err, rows) => {
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
/**
 * 创建预处理语句
 * @description 创建一个可重复使用的预处理SQL语句，返回语句标识符
 * @param {string} dbName - 数据库名称
 * @param {string} sql - 预处理SQL语句（使用?作为参数占位符）
 * @returns {Promise<Symbol>} 预处理语句的唯一标识符
 * @example
 * const stmtKey = await stmtPrepare('main.db', 'INSERT INTO users (name, email) VALUES (?, ?)');
 */
export const stmtPrepare = (dbName: string, sql: string): Promise<Symbol> => {
  return new Promise((resolve, reject) => {
    const db = initDatabase(dbName);
    const stmt = db.prepare(sql, function (err) {
      if (err) {
        log2File("预处理语句失败:", err.message);
        reject(err);
      } else {
        const stmtKey = Symbol();
        statementMap.set(stmtKey, stmt);
        // 加入到数据库语句列表
        const dbStmtList = databaseStmtMap.get(dbName) || [];
        dbStmtList.push(stmtKey);
        databaseStmtMap.set(dbName, dbStmtList);
        resolve(stmtKey);
      }
    });
  });
};
// #endregion

// #region 关闭预处理语句
/**
 * 关闭预处理语句
 * @description 关闭指定的预处理语句并释放相关资源
 * @param {Symbol} stmtKey - 预处理语句的标识符
 * @param {string} [dbName] - 可选的数据库名称，提供此参数可提高性能
 * @returns {Promise<void>} 异步操作Promise
 * @example
 * await stmtClose(stmtKey, 'main.db');
 */
export const stmtClose = (stmtKey: Symbol, dbName?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const stmt = statementMap.get(stmtKey);
    if (!stmt) return log2File(`预处理语句 ${stmtKey} 未存在`);
    stmt.finalize((err) => {
      if (err) {
        log2File("关闭预处理语句失败:", err.message);
        reject(err);
      } else {
        statementMap.delete(stmtKey);
        // 根据是否有传入dbName进行分别处理
        if (dbName) {
          // 获取对应map直接删除即可
          const dbStmtList = databaseStmtMap.get(dbName) || [];
          const index = dbStmtList.indexOf(stmtKey);
          if (index !== -1) {
            dbStmtList.splice(index, 1);
            databaseStmtMap.set(dbName, dbStmtList);
          }
        } else {
          // 获取Symbol所属的数据库文件名称
          const dbNameList = databaseStmtMap.keys();
          for (const dbName of dbNameList) {
            const dbStmtList = databaseStmtMap.get(dbName) || [];
            const index = dbStmtList.indexOf(stmtKey);
            if (index !== -1) {
              dbStmtList.splice(index, 1);
              databaseStmtMap.set(dbName, dbStmtList);
              break;
            }
          }
        }
        resolve();
      }
    });
  });
};
// #endregion

// #region 执行预处理语句
/**
 * 执行预处理语句
 * @description 使用指定参数执行预处理语句（INSERT、UPDATE、DELETE等）
 * @param {Symbol} stmtKey - 预处理语句的标识符
 * @param {any[]} params - SQL参数数组，默认为空数组
 * @returns {Promise<sqlite.RunResult>} 包含lastID、changes等信息的执行结果
 * @example
 * const result = await stmtRun(stmtKey, ['张三', 'zhangsan@example.com']);
 * console.log(result.lastID); // 新插入记录的ID
 */
export const stmtRun = (
  stmtKey: Symbol,
  params: any[] = []
): Promise<sqlite.RunResult> => {
  return new Promise((resolve, reject) => {
    const stmt = statementMap.get(stmtKey);
    if (!stmt) return log2File(`预处理语句 ${stmtKey} 未存在`);
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
/**
 * 使用预处理语句查询单条数据
 * @description 使用预处理语句执行SELECT查询并返回第一条匹配的记录
 * @template T - 返回数据的类型
 * @param {Symbol} stmtKey - 预处理语句的标识符
 * @param {any[]} params - SQL参数数组，默认为空数组
 * @returns {Promise<T | undefined>} 查询结果，如果没有找到记录则返回undefined
 * @example
 * interface User { id: number; name: string; email: string; }
 * const user = await stmtGet<User>(stmtKey, [1]);
 */
export const stmtGet = <T>(
  stmtKey: Symbol,
  params: any[] = []
): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    const stmt = statementMap.get(stmtKey);
    if (!stmt) return log2File(`预处理语句 ${stmtKey} 未存在`);
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
/**
 * 使用预处理语句查询多条数据
 * @description 使用预处理语句执行SELECT查询并返回所有匹配的记录
 * @template T - 返回数据的类型
 * @param {Symbol} stmtKey - 预处理语句的标识符
 * @param {any[]} params - SQL参数数组，默认为空数组
 * @returns {Promise<T[]>} 查询结果数组，如果没有找到记录则返回空数组
 * @example
 * interface User { id: number; name: string; email: string; }
 * const users = await stmtQuery<User>(stmtKey, [18]);
 */
export const stmtQuery = <T>(
  stmtKey: Symbol,
  params: any[] = []
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const stmt = statementMap.get(stmtKey);
    if (!stmt) return log2File(`预处理语句 ${stmtKey} 未存在`);
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
