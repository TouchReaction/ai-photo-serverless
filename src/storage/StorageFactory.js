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
