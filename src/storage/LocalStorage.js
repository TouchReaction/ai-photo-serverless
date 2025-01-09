const StorageInterface = require("./StorageInterface");
const path = require("path");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");
const { logger } = require("../config/logger");
const ConfigManager = require("../config/config");

class LocalStorage extends StorageInterface {
  constructor() {
    super();
    this.permanentDir = path.resolve(process.env.PERMANENT_DIR);
    this.tempDir = path.resolve(process.env.TEMP_DIR);
    this.jwtSecret = process.env.JWT_SECRET;
    this.initDirectories();
  }

  async initDirectories() {
    await fs.mkdir(this.permanentDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  async saveFile(file) {
    const isTemp = this.getIsTemp();
    const targetDir = isTemp ? this.tempDir : this.permanentDir;
    const filename = isTemp ? "temp.jpg" : file.originalname;
    const filepath = path.join(targetDir, filename);

    try {
      await fs.writeFile(filepath, file.buffer);
      logger.info(`File saved: ${filepath}`);
      return filename;
    } catch (error) {
      logger.error(`Error saving file: ${error.message}`, { error });
      throw error;
    }
  }

  async getFileUrl(filename) {
    const config = ConfigManager.getInstance();
    const { urlExpiration = 3600 } = config.getConfig();
    const isTemp = this.getIsTemp();
    const filepath = path.join(
      isTemp ? this.tempDir : this.permanentDir,
      filename
    );

    const token = jwt.sign(
      { filepath, exp: Math.floor(Date.now() / 1000) + urlExpiration },
      this.jwtSecret
    );

    return `/api/file/${token}`;
  }

  async verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }
}

module.exports = LocalStorage;
