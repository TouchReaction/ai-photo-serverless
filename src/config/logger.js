const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${
      stack ? "\n" + stack : ""
    }`;
  })
);

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),

    // 信息级别日志文件
    new DailyRotateFile({
      filename: path.join(__dirname, "../../logs/info-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "info",
      maxFiles: "30d", // 保留30天的日志
      maxSize: "20m", // 单个文件最大20MB
    }),

    // 错误级别日志文件
    new DailyRotateFile({
      filename: path.join(__dirname, "../../logs/error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "30d",
      maxSize: "20m",
    }),
  ],
});

// 添加请求日志中间件
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

module.exports = { logger, requestLogger };
