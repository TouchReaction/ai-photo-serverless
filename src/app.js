const express = require("express");
const multer = require("multer");

// 只在非生产环境加载 .env 文件
let config;
if (process.env.NODE_ENV !== "production") {
  config = require("dotenv").config();
}

const { logger, requestLogger } = require("./logger");
const RequestError = require("./RequestError");

const app = express();

app.use(express.json());
// 添加请求日志中间件
app.use(requestLogger);

app.use("/", require("./upload"));

// 错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err instanceof RequestError) {
    logger.error("Request error:", err);
    res.status(400).json({ success: false, error: err.message });
  } else {
    logger.error("Unhandled error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  if (config) logger.info(config.parsed);
});

// 处理未捕获的异常
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
});

module.exports = app;
