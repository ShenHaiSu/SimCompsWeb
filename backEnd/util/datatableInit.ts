// #region 描述
// 本文件提供了 SQLite 数据库操作的工具函数，
// 包括数据库的初始化、关闭、执行 SQL 语句（带或不带返回）、
// 查询单条或多条数据，以及预处理语句的管理和执行。
// #endregion

// #region 引入
import type { Schema } from "#composable/app/Schemas.ts";
import fs from "node:fs";
import path from "node:path";
import { log2File } from "@util/tool.ts";
import { get, initDatabase, query, run } from "@util/database.ts";
// #endregion

// #region 变量常量初始化
// const databaseForeignKey = new Map<string,Schema['foreignKey']>();
// #endregion

// #region 暴露函数
/**
 * 数据表初始化函数
 * 读取schema目录下的所有TypeScript文件，根据schema配置初始化SQLite数据库表
 * 包括创建表、检查字段类型一致性、创建索引等操作
 * @returns {Promise<void>} 无返回值的Promise
 * @throws {Error} 当初始化过程中发生错误时抛出异常
 */
export const dataTableInit = async () => {
  try {
    // 创建 schema 目录
    fs.mkdirSync(path.resolve("schema"), { recursive: true });

    // 读取 schema 目录下的所有 ts 文件，获取其暴露出来的各个api
    const fileList: string[] = await getFileList(path.resolve("schema"));

    // 逐一处理
    for (const file of fileList) {
      const filePath = path.resolve(__dirname, "../schema", file);
      if (!filePath.endsWith(".ts")) continue;
      const importedModule = await import(filePath);
      const schema = importedModule.schema as Schema;
      if (!schema.sqliteSupport) continue;
      // 使用子函数进行处理这个模板文件
      await fileHandleFunc(schema);
      log2File(`[数据表格初始化] 处理模板文件成功 - ${schema.fileName}.${schema.tableName}`);
    }
  } catch (err) {
    console.error(err);
    log2File(`[数据表格初始化] 初始化失败 - ${err}`);
    throw err;
  }
};
// #endregion

// #region 获取文件列表
/**
 * 获取指定目录下的所有TypeScript文件列表
 * @param {string} dirPath - 目录路径
 * @returns {Promise<string[]>} 返回包含所有.ts文件名的数组
 * @throws {Error} 当读取目录失败时抛出异常
 */
const getFileList = async (dirPath: string): Promise<string[]> => {
  try {
    const files = await fs.promises.readdir(dirPath);
    return files.filter((file) => file.endsWith(".ts"));
  } catch (err) {
    console.error(err);
    log2File(`[数据表格初始化] 获取文件列表失败 - ${err}`);
    throw err;
  }
};
// #endregion

// #region 处理模板文件
/**
 * 处理单个schema模板文件
 * 根据schema配置执行数据库初始化、表创建、字段检查、索引创建等操作
 * @param {Schema} schema - 数据库表的schema配置对象
 * @returns {Promise<void>} 无返回值的Promise
 * @throws {Error} 当处理过程中发生错误时抛出异常
 */
const fileHandleFunc = async (schema: Schema): Promise<void> => {
  try {
    // 创建数据库链接
    initDatabase(schema.fileName);

    // 判断表格是否已经存在
    const tableExist = await checkTableExist(schema.fileName, schema.tableName);

    // 分支判断
    if (!tableExist) await createDataTable(schema.fileName, schema.tableName, schema);

    // 执行字段类型检查
    await checkFieldType(schema.fileName, schema.tableName, schema.fields);

    // 创建索引
    await createIndex(schema.fileName, schema.index);

    // 将外键依赖进行记录
    // 暂时不启用，因为sqlite不能在创建表之后进行外键依赖
    // databaseForeignKey.set(`${schema.fileName}.${schema.tableName}`, schema.foreignKey);
  } catch (err) {
    log2File(`[数据表格初始化] 处理模板文件失败`);
    throw err;
  }
};
// #endregion

// #region 检查数据表是否已经存在
/**
 * 检查指定数据库中的数据表是否已经存在
 * @param {string} fileName - 数据库文件名
 * @param {string} tableName - 数据表名
 * @returns {Promise<boolean>} 返回表是否存在的布尔值
 * @throws {Error} 当查询过程中发生错误时抛出异常
 */
const checkTableExist = async (fileName: string, tableName: string): Promise<boolean> => {
  try {
    const sql = `select name from sqlite_master where type='table' and name= ?`;
    const result = await get(fileName, sql, [tableName]);
    return !!result;
  } catch (err) {
    log2File(`[数据表格初始化] 检查数据表是否已经存在失败 - ${err}`);
    throw err;
  }
};
// #endregion

// #region 创建数据表
/**
 * 根据schema配置创建数据表
 * @param {string} fileName - 数据库文件名
 * @param {string} tableName - 数据表名
 * @param {Schema} schema - 包含表结构信息的schema对象
 * @returns {Promise<void>} 无返回值的Promise
 * @throws {Error} 当创建表过程中发生错误时抛出异常
 */
const createDataTable = async (fileName: string, tableName: string, schema: Schema) => {
  try {
    const sql = `create table if not exists ${tableName} (${schema.fields
      .map((field) => `${field.name} ${field.type} ${field.other}`)
      .join(",")} ${schema.other})`;
    await run(fileName, sql);
  } catch (err) {
    log2File(`[数据表格初始化] 创建数据表失败 - ${err}`);
    throw err;
  }
};
// #endregion

// #region 字段类型一致性检查
/**
 * 字段类型一致性检查
 * @param fileName 数据库文件名称
 * @param tableName 数据表名称
 * @param fields 字段列表
 */
const checkFieldType = async (fileName: string, tableName: string, fields: Schema["fields"]) => {
  try {
    const sql = `PRAGMA table_info(${tableName})`;
    const result = await query(fileName, sql);
    const fieldMap = new Map(result.map((item: any) => [item.name, item.type]));
    for (const field of fields) {
      if (fieldMap.get(field.name) !== field.type) {
        log2File(`[数据表格初始化] 字段类型不一致 - ${tableName}.${field.name} 期望类型: ${field.type} 实际类型: ${fieldMap.get(field.name)}`);
        throw new Error(`[数据表格初始化] 字段类型不一致 - ${tableName}.${field.name} 期望类型: ${field.type} 实际类型: ${fieldMap.get(field.name)}`);
      }
    }
  } catch (err) {
    log2File(`[数据表格初始化] 字段类型一致性检查失败 - ${err}`);
    throw err;
  }
};
// #endregion

// #region 创建索引
/**
 * 根据schema配置创建数据库索引
 * @param {string} fileName - 数据库文件名
 * @param {Schema["index"]} index - 包含索引SQL语句的数组
 * @returns {Promise<void>} 无返回值的Promise
 * @throws {Error} 当创建索引过程中发生错误时抛出异常
 */
const createIndex = async (fileName: string, index: Schema["index"]) => {
  try {
    for (const sql of index) await run(fileName, sql);
  } catch (err) {
    log2File(`[数据表格初始化] 创建索引失败 - ${err}`);
    throw err;
  }
};
// #endregion
