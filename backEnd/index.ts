import type { Express } from "express";
import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import apiRouter from "@/routerEntry.ts";
import requestLogger from "@middleware/requestLog.ts";
import { dataTableInit } from "@util/datatableInit.ts";
import { checkFrontEndDist } from "@util/tool.ts";

const app: Express = express();
const port = 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(requestLogger);

// 初始化数据库以及数据表
await dataTableInit();

// 检查前端打包路径存在性
checkFrontEndDist();

// 拦截/api的路径，指向apiRouter
app.use("/api", apiRouter);

// 静态资源目录配置
const staticDir = path.join(__dirname, "./frontEndDist");

// 使用中间件逻辑，挂载前端的静态资源
app.use(express.static(staticDir));

// 兜底前端
app.use((req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

// 启动服务器
app.listen(port, () => {
  console.log(`⚡️[服务器]: 服务器正在端口 ${port} 上运行`);
});

export default app;
