const { logger } = require("./logger");

class ConfigManager {
  static instance = null;

  constructor() {
    this.config = {
      storageStrategy: process.env.STORAGE_STRATEGY, // 存储策略：'local' 或 'oss'
      tempStorage: process.env.TEMP_STORAGE?.toUpperCase() === "TRUE", // 是否使用临时存储
      urlExpiration: parseInt(process.env.EXPIRATION), // URL过期时间（秒）
    };
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new ConfigManager();
    }
    return this.instance;
  }

  getConfig() {
    return { ...this.config };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info(this.config);
    return this.config;
  }
}

module.exports = ConfigManager;
