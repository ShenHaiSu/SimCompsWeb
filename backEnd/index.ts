import express from "express";
import type { Express } from "express";
import cors from "cors";
import path from "path";
import compression from "compression";
import apiRouter from "./routerEntry";
import requestLogger from "#middleware/requestLog.ts";
import { dataTableInit } from "#util/datatableInit.ts";

const app: Express = express();
const port = 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(requestLogger);

// 初始化数据库以及数据表
await dataTableInit();

// 拦截/api的路径，指向apiRouter
app.use("/api", apiRouter);

// 使用中间件逻辑，挂载前端的静态资源
app.use(express.static(path.join(__dirname, "../frontEndDist")));

// 使用中间件的逻辑，将所有的请求都指向frontEndDist中的index.html
app.use(express.static(path.join(__dirname, "../frontEndDist")));

// 启动服务器
app.listen(port, () => {
  console.log(`⚡️[服务器]: 服务器正在端口 ${port} 上运行`);
});

export default app;
