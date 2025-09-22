// #region 外部引入
import sqlite3 from 'sqlite3';
// #endregion

// #region 常量变量区
const dbPath = `./database.db`;
const stmtList: Set<sqlite3.Statement> = new Set();
let database: sqlite3.Database | null = null;
// #endregion

// #region 初始化数据库链接
export const initDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (database) return resolve();
    database = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      console.log('数据库初始化成功');
      resolve();
    });
  });
};
// #endregion

// #region 关闭数据库链接
export const closeDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return resolve();
    database.close((err) => {
      if (err) return reject(err);
      database = null;
      console.log('数据库关闭成功');
      resolve();
    });
  });
};
// #endregion

// #region 执行
export const run = async (
  sqlString: string,
  sqlParams: any[] = [],
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('数据库未初始化'));
    database.run(sqlString, sqlParams, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};
// #endregion

// #region 批量查询
export const query = async (
  sqlString: string,
  sqlParams: any[] = [],
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('数据库未初始化'));
    database.all(sqlString, sqlParams, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};
// #endregion

// #region 单条查询
export const get = async (
  sqlString: string,
  sqlParams: any[] = [],
): Promise<any | null> => {
  const rows = await query(sqlString, sqlParams);
  return rows.length > 0 ? rows[0] : null;
};
// #endregion

// #region 语句-准备
export const stmtPrepare = async (
  sqlString: string,
): Promise<sqlite3.Statement> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('数据库未初始化'));
    const stmt = database.prepare(sqlString, (err) => {
      if (err) return reject(err);
      stmtList.add(stmt);
      resolve(stmt);
    });
  });
};
// #endregion

// #region 语句-终结
export const stmtFinalize = async (stmt: sqlite3.Statement): Promise<void> => {
  return new Promise((resolve, reject) => {
    stmt.finalize((err) => {
      if (err) return reject(err);
      stmtList.delete(stmt);
      resolve();
    });
  });
};
// #endregion

// #region 语句-执行
export const stmtRun = async (
  stmt: sqlite3.Statement,
  params: any[] = [],
): Promise<void> => {
  return new Promise((resolve, reject) => {
    stmt.run(params, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};
// #endregion

// #region 语句-单查询
export const stmtGet = async (
  stmt: sqlite3.Statement,
  params: any[] = [],
): Promise<any | null> => {
  return new Promise((resolve, reject) => {
    stmt.get(params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};
// #endregion

// #region 语句-多查询
export const stmtQuery = async (
  stmt: sqlite3.Statement,
  params: any[] = [],
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    stmt.all(params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};
// #endregion
