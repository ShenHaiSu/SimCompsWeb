import path from "node:path";
import fs from "node:fs";
import process from "node:process";

// #region 全局变量
// 输出队列
let outputQueue: string[] = [];
// 定时器
let outputTimer: NodeJS.Timeout | null = null;
// 退出钩子是否已注册
let exitHooksRegistered: boolean = false;
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

// #region 注册退出钩子
/**
 * 注册程序退出时的钩子，确保所有日志写入文件
 */
function registerExitHooks(): void {
  if (exitHooksRegistered) return;

  const shutdownHandler = () => {
    if (outputTimer) {
      clearInterval(outputTimer);
      outputTimer = null;
    }
    processQueue();
  };

  process.on("beforeExit", shutdownHandler);
  process.on("exit", shutdownHandler);
  process.on("SIGINT", () => {
    console.log("Received SIGINT. Flushing logs and exiting.");
    shutdownHandler();
    process.exit(0); // 确保进程退出
  });
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    shutdownHandler();
    process.exit(1); // 确保进程退出并带有错误码
  });

  exitHooksRegistered = true;
}
// #endregion

// #region 导出日志写入函数
/**
 * 将日志内容写入文件
 * 
 * ！！不要在传入之前就写时间戳！！
 * @param args 日志内容参数列表
 */
export function log2File(...args: any[]): void {
  const content = args.map((arg) => String(arg)).join(" ");
  // 追加时间戳
  const timestamp = new Date().toISOString();
  outputQueue.push(`${timestamp} ${content}`);
  console.log(`${timestamp} ${content}`);
  initializeTimer();
  registerExitHooks(); // 每次调用 log2File 都尝试注册，但内部有去重
}
// #endregion
