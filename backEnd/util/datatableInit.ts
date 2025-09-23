// #region 描述
// 本文件提供了 SQLite 数据库操作的工具函数，
// 包括数据库的初始化、关闭、执行 SQL 语句（带或不带返回）、
// 查询单条或多条数据，以及预处理语句的管理和执行。
// #endregion

// #region 引入
import path from "path";
import fs from "fs";
import { log2File } from "#util/tool.ts";
import { get, query } from "#util/database.ts";
// #endregion

// #region 暴露函数
export const dataTableInit = async () => {
  try {
    // 读取 schema 目录下的所有 ts 文件，获取其暴露出来的各个api
    const fileList = await getFileList(path.resolve(__dirname, "../schema"));

    console.log(fileList);
  } catch (err) {
    console.error(err);
    log2File(`[数据表格初始化] 初始化失败 - ${err}`);
    throw err;
  }
};
// #endregion

// #region 获取文件列表
const getFileList = async (dirPath: string) => {
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
