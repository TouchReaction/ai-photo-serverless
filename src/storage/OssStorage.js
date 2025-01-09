const StorageInterface = require("./StorageInterface");
const OSS = require("ali-oss");

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
    const filename = isTemp ? 'temp.jpg' : `${Date.now()}-${file.originalname}`;
    const path = isTemp ? this.tempPath : this.permanentPath;
    
    if (isTemp) {
      // 删除旧的临时文件
      const list = await this.client.list({ prefix: this.tempPath });
      for (const obj of list.objects || []) {
        await this.client.delete(obj.name);
      }
    }

    await this.client.put(`${path}${filename}`, file.buffer);
    return filename;
  }

  async getFileUrl(filename) {
    const url = await this.client.generatePresignedUrl(filename);
    return url;
  }

  async downloadFile(filename) {
    const result = await this.client.get(filename);
    return result.content;
  }

  async deleteFile(filename) {
    await this.client.delete(filename);
  }
}

module.exports = OssStorage;
