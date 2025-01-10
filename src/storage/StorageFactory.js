const ConfigManager = require("../config/config");
const LocalStorage = require("./LocalStorage");
const OssStorage = require("./OssStorage");

class StorageFactory {
  static instance = null;
  static currentStrategy; // 默认使用本地存储

  static getInstance() {
    const { storageStrategy } = ConfigManager.getInstance().getConfig();
    if (this.currentStrategy !== storageStrategy) {
      this.currentStrategy = storageStrategy;
      this.instance = this.createStorage();
    }
    return this.instance;
  }

  static createStorage() {
    if (this.currentStrategy === "oss") {
      return new OssStorage();
    } else {
      return new LocalStorage();
    }
  }

  static setStrategy(strategy) {
    this.currentStrategy = strategy;
    this.instance = this.createStorage();
  }
}

module.exports = StorageFactory;
