const LocalStorage = require("./LocalStorage");
const OssStorage = require("./OssStorage");

class StorageFactory {
  static instance = null;
  static currentStrategy = "local"; // 默认使用本地存储

  static getInstance() {
    if (!this.instance) {
      this.instance = this.createStorage();
    }
    return this.instance;
  }

  static createStorage() {
    switch (this.currentStrategy) {
      case "local":
        return new LocalStorage();
      case "oss":
        return new OssStorage();
      default:
        throw new Error("Invalid storage strategy");
    }
  }

  static setStrategy(strategy) {
    this.currentStrategy = strategy;
    this.instance = this.createStorage();
  }
}

module.exports = StorageFactory;
