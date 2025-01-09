const StorageInterface = require("./StorageInterface");
const path = require("path");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");
const ConfigManager = require("../config/config");
const { logger } = require('../config/logger');

class LocalStorage extends StorageInterface {
  constructor() {
    super();
    this.permanentDir = path.join(__dirname, "../../uploads/permanent");
    this.tempDir = path.join(__dirname, "../../uploads/temp");
    this.jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    this.initDirectories();
  }

  async initDirectories() {
    await fs.mkdir(this.permanentDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  async saveFile(file) {
    const isTemp = this.getIsTemp();
    const targetDir = isTemp ? this.tempDir : this.permanentDir;
    const filename = isTemp ? 'temp.jpg' : `${Date.now()}-${file.originalname}`;
    const filepath = path.join(targetDir, filename);
    
    try {
      if (isTemp) {
        logger.info('Cleaning temporary storage directory');
        const files = await fs.readdir(this.tempDir);
        for (const file of files) {
          await fs.unlink(path.join(this.tempDir, file));
          logger.debug(`Deleted temp file: ${file}`);
        }
      }

      await fs.writeFile(filepath, file.buffer);
      logger.info(`File saved successfully: ${filename} (${isTemp ? 'temporary' : 'permanent'})`);
      return filename;
    } catch (error) {
      logger.error(`Error saving file: ${error.message}`, { error });
      throw error;
    }
  }

  async getFileUrl(filename) {
    try {
      const url = await super.getFileUrl(filename);
      logger.info(`Generated URL for file: ${filename}`);
      return url;
    } catch (error) {
      logger.error(`Error generating URL for file ${filename}: ${error.message}`);
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  async getFilePath(filename) {
    const permanentPath = path.join(this.permanentDir, filename);
    const tempPath = path.join(this.tempDir, filename);

    if (
      await fs
        .access(permanentPath)
        .then(() => true)
        .catch(() => false)
    ) {
      return permanentPath;
    }
    if (
      await fs
        .access(tempPath)
        .then(() => true)
        .catch(() => false)
    ) {
      return tempPath;
    }
    throw new Error("File not found");
  }

  async deleteFile(filename) {
    const filepath = path.join(this.permanentDir, filename);
    await fs.unlink(filepath);
  }
}

module.exports = LocalStorage;
