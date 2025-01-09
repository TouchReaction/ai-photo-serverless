const StorageInterface = require("./StorageInterface");
const OSS = require("ali-oss");
const { logger } = require("../config/logger");

class OssStorage extends StorageInterface {
  constructor() {
    super();
    this.client = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
    });
    this.tempPath = "temp/";
    this.permanentPath = "permanent/";
  }

  async saveFile(file) {
    const isTemp = this.getIsTemp();
    const path = isTemp ? this.tempPath : this.permanentPath;
    const filename = isTemp ? "temp.jpg" : file.originalname;
    const ossPath = `${path}${filename}`;

    try {
      await this.client.put(ossPath, file.buffer);
      logger.info(`File saved to OSS: ${ossPath}`);
      return filename;
    } catch (error) {
      logger.error(`Error saving file to OSS: ${error.message}`);
      throw error;
    }
  }

  async getFileUrl(filename) {
    const isTemp = this.getIsTemp();
    const path = isTemp ? this.tempPath : this.permanentPath;
    try {
      const config = ConfigManager.getInstance();
      const { urlExpiration } = config.getConfig();
      const url = this.client.signatureUrl(`${path}${filename}`, {
        expires: urlExpiration,
      });
      return url;
    } catch (error) {
      logger.error(`Error generating URL: ${error.message}`);
      throw error;
    }
  }
}

module.exports = OssStorage;
