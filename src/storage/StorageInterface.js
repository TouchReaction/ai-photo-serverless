const ConfigManager = require('../config/config');

class StorageInterface {
  async saveFile(file) {
    throw new Error("Method not implemented");
  }

  async getFileUrl(filename) {
    throw new Error("Method not implemented");
  }

  getIsTemp() {
    const config = ConfigManager.getInstance();
    return config.getConfig().tempStorage;
  }
}

module.exports = StorageInterface;
