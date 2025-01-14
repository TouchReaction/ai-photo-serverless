const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");
const { logger } = require("./logger");
const RequestError = require("./RequestError");

// 文件上传配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // 获取上传路径，默认为 uploads
    const root = process.env.ROOT_PATH;
    const filepath = path.join(root, req.path.replace("/upload/", ""));
    logger.info(`Filepath is: ${filepath}`);
    // 确保目录存在
    await fs.mkdir(filepath, { recursive: true });
    cb(null, filepath);
  },
  filename: (req, file, cb) => cb(null, "temp.jpg"),
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = ["image/jpeg"];
  if (allowedTypes.includes(file.mimetype)) return cb(null, true);
  const error = new RequestError(`Rejected file type: ${file.mimetype}`);
  cb(error, false);
};

const fileSize = parseFloat(process.env.MAX_SIZE) * 1024 * 1024;

const upload = multer({ storage, fileFilter, limits: { fileSize } });

// 上传接口
router.post("/upload/*", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) throw new RequestError("No file uploaded");

    const { filename, size, path } = req.file;
    logger.info("File save successfully");
    logger.info({ filename, size, path });

    // 生成 JWT token
    const options = { expiresIn: process.env.EXPIRE };
    const token = jwt.sign({ filepath: path }, process.env.JWT_SECRET, options);

    res.json({ success: true, token });
  } catch (error) {
    next(error);
  }
});

// 获取模板内容
async function getTemplate(type, params) {
  params.title = process.env.TITLE;
  const templatePath = path.join(__dirname, "templates", `${type}.html`);
  const content = await fs.readFile(templatePath, "utf8");
  const replace = (data, [key, value]) => data.replace(`{{${key}}}`, value);
  return Object.entries(params).reduce(replace, content);
}

// Token 访问接口
router.get("/:token", async (req, res) => {
  try {
    // 验证 token
    const { filepath } = jwt.verify(req.params.token, process.env.JWT_SECRET);
    logger.info(`Filepath is: ${filepath}`);

    // 读取文件内容（Base64）
    const base64 = (await fs.readFile(filepath)).toString("base64");
    const image = `data:image/jpeg;base64,${base64}`;

    // 获取并填充模板
    const html = await getTemplate("success", { image });

    res.send(html);
    logger.info("Image download successfully", { filepath });
  } catch (error) {
    logger.error("Failed to download image:", error);

    let message = "服务器错误";
    if (error.name === "TokenExpiredError") message = "链接超时，请重新上传";
    const errorTemplate = await getTemplate("error", { message });

    res.status(404).send(errorTemplate);
  }
});

module.exports = router;
