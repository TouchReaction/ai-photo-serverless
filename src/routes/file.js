const express = require("express");
const router = express.Router();
const StorageFactory = require("../storage/StorageFactory");

router.get("/:token", async (req, res) => {
  try {
    const storage = StorageFactory.getInstance();
    // 验证token并获取文件信息
    const fileInfo = await storage.verifyToken(req.params.token);
    // 发送文件
    res.sendFile(fileInfo.filepath);
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

module.exports = router;
