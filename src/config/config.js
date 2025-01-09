class ConfigManager {
  static instance = null;

  constructor() {
    this.config = {
      storageStrategy: "local", // 存储策略：'local' 或 'oss'
      tempStorage: false, // 是否使用临时存储
      urlExpiration: 3600, // URL过期时间（秒）
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
    return this.config;
  }
}

module.exports = ConfigManager;
