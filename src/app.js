const express = require("express");
const uploadRoutes = require("./routes/upload");
const adminRoutes = require("./routes/admin");
const fileRoutes = require("./routes/file");
const { logger, requestLogger } = require("./config/logger");
require("dotenv").config();

const app = express();

// 添加请求日志中间件
app.use(requestLogger);

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

app.use(express.json());

app.use("/api", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/file", fileRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// 处理未捕获的异常
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
});

module.exports = app;