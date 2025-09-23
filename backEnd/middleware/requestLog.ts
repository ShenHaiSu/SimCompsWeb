import type { Request, Response, NextFunction } from "express";
import { log2File } from "#util/tool.ts";

// 请求日志中间件
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const reqPath = req.originalUrl || req.url;
  const reqData = { body: req.body, query: req.query, params: req.params };
  log2File(`[${timestamp}] ${req.method} ${reqPath} - IP:${req.ip} - ${JSON.stringify(reqData)}`);
  next();
};

export default requestLogger;
