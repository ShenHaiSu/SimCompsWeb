import path from "path";
import fs from "fs";

// #region 全局变量
// 输出队列
let outputQueue: string[] = [];
// 定时器
let outputTimer: NodeJS.Timeout | null = null;
// #endregion

// #region 确保日志目录存在
/**
 * 确保日志目录存在
 */
function ensureLogDirectory(): void {
  const logDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}
// #endregion

// #region 获取日志文件路径
/**
 * 获取当前日期的日志文件路径
 */
function getLogFilePath(): string {
  const today = new Date().toISOString().split("T")[0];
  return path.join(process.cwd(), "logs", `${today}.log`);
}
// #endregion

// #region 处理输出队列
/**
 * 将队列中的内容写入日志文件
 */
function processQueue(): void {
  if (outputQueue.length === 0) return;

  ensureLogDirectory();
  const logFile = getLogFilePath();
  const content = outputQueue.join("\n") + "\n";

  fs.appendFileSync(logFile, content);
  outputQueue = [];
}
// #endregion

// #region 初始化定时器
/**
 * 初始化输出定时器
 */
function initializeTimer(): void {
  if (outputTimer === null) {
    outputTimer = setInterval(() => {
      processQueue();
    }, 10000); // 10秒
  }
}
// #endregion

// #region 导出日志写入函数
/**
 * 将日志内容写入文件
 * @param args 日志内容参数列表
 */
export function log2File(...args: any[]): void {
  const content = args.map(arg => String(arg)).join(' ');
  outputQueue.push(content);
  console.log(content);
  initializeTimer();
}
// #endregion
