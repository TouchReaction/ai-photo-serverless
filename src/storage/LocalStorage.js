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
      logger.info(`File saved: ${filepath})`);
      return filename;
    } catch (error) {
      logger.error("Failed to save file", { error });
      throw error;
    }
  }

  async getFileUrl(filename) {
    const config = ConfigManager.getInstance();
    const { urlExpiration } = config.getConfig();
    const isTemp = this.getIsTemp();
    const dir = isTemp ? this.tempDir : this.permanentDir;
    const filepath = path.join(dir, filename);

    logger.info(`Attempting to generate URL: ${filepath}`);

    try {
      await fs.access(filepath);
      const token = jwt.sign(
        { filepath, exp: Math.floor(Date.now() / 1000) + urlExpiration },
        this.jwtSecret
      );
      logger.info(`URL generated successfully. Token: ${token}`);
      return `/api/file/${token}`;
    } catch (error) {
      logger.error("File not found while generating URL", { error });
      throw new Error("File not found");
    }
  }

  async verifyToken(token) {
    try {
      logger.info(`Verifying token: ${token}`);
      const decoded = jwt.verify(token, this.jwtSecret);
      logger.info("Token verified successfully");
      logger.info(decoded);
      return decoded;
    } catch (error) {
      logger.error("Token verification failed", { error });
      throw new Error("Invalid or expired token");
    }
  }
}

module.exports = LocalStorage;
