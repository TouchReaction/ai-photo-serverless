const express = require("express");
const router = express.Router();
const multer = require("multer");
const StorageFactory = require("../storage/StorageFactory");
const ConfigManager = require("../config/config");
const { logger } = require("../config/logger");

const upload = multer({ storage: multer.memoryStorage() });

function getFullUrl(req, url) {
  if (url.startsWith("/")) {
    const protocol = req.protocol;
    const host = req.get("host");
    return `${protocol}://${host}${url}`;
  }
  return url;
}

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const storage = StorageFactory.getInstance();
    if (!req.file.originalname.endsWith(".jpg")) {
      logger.error(`不支持的文件：${req.file.originalname}`);
      return res
        .status(400)
        .json({ success: false, error: "Not support file type" });
    }
    const filename = await storage.saveFile(req.file);
    const url = getFullUrl(req, await storage.getFileUrl(filename));

    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/url/:filename", async (req, res) => {
  try {
    const config = ConfigManager.getInstance();
    if (config.getConfig().tempStorage) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    const storage = StorageFactory.getInstance();
    const url = getFullUrl(req, await storage.getFileUrl(req.params.filename));

    res.json({ success: true, url });
  } catch (error) {
    res.status(404).json({ success: false, error: "File not found" });
  }
});

module.exports = router;
