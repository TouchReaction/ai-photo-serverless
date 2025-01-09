const express = require("express");
const router = express.Router();
const StorageFactory = require("../storage/StorageFactory");
const ConfigManager = require("../config/config");

// 更改存储策略
router.post("/storage/strategy", (req, res) => {
  try {
    const { strategy } = req.body;
    StorageFactory.setStrategy(strategy);

    // 同时更新配置
    const config = ConfigManager.getInstance();
    config.updateConfig({ storageStrategy: strategy });

    res.json({
      success: true,
      message: `Storage strategy changed to ${strategy}`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// 更改临时存储设置
router.post("/storage/temp", (req, res) => {
  try {
    const { tempStorage } = req.body;
    const config = ConfigManager.getInstance();
    config.updateConfig({ tempStorage: Boolean(tempStorage) });

    res.json({
      success: true,
      message: `Temp storage set to ${tempStorage}`,
      config: config.getConfig(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取当前配置
router.get("/config", (req, res) => {
  try {
    const config = ConfigManager.getInstance();
    res.json({
      success: true,
      config: config.getConfig(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// 设置URL过期时间
router.post('/url-expiration', (req, res) => {
    try {
        const { expiration } = req.body;
        const config = ConfigManager.getInstance();
        
        if (!Number.isInteger(expiration) || expiration <= 0) {
            throw new Error('Expiration must be a positive integer');
        }

        config.updateConfig({ urlExpiration: expiration });
        
        res.json({ 
            success: true, 
            message: `URL expiration set to ${expiration} seconds`,
            config: config.getConfig()
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
