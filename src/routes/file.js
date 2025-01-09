const express = require("express");
const router = express.Router();
const StorageFactory = require("../storage/StorageFactory");
const LocalStorage = require("../storage/LocalStorage");
const { logger } = require("../config/logger");
const fs = require("fs").promises;

router.get("/:token", async (req, res) => {
  let fileInfo;
  try {
    const storage = StorageFactory.getInstance();
    if (!storage instanceof LocalStorage) {
      logger.error("存储模式不匹配");
      return res.status(404).json({ success: false, error: "File Not Found" });
    }
    // 验证token并获取文件信息
    fileInfo = await storage.verifyToken(req.params.token);
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
  try {
    // 发送文件
    res.sendFile(fileInfo.filepath);
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

module.exports = router;
