const request = require("supertest");
const path = require("path");
const fs = require("fs").promises;
const app = require("../src/app");
const ConfigManager = require("../src/config/config");
const jwt = require("jsonwebtoken");

describe("Storage API Tests", () => {
  const testFixturesDir = path.resolve("fixtures");
  const testImagePath = path.join(testFixturesDir, "test.jpg");
  const uploadsDir = path.resolve("uploads");
  const config = ConfigManager.getInstance();
  const apiKey = process.env.API_KEY;

  async function removeDir(dir) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  beforeAll(async () => {
    // 创建测试文件
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(testFixturesDir, { recursive: true });
    await fs.writeFile(testImagePath, "fake image content");
  });

  afterAll(async () => {
    // 清理测试文件和上传目录
    await removeDir(testFixturesDir);
    await removeDir(uploadsDir);
  });

  beforeEach(() => {
    // 重置为永久保存模式
    config.updateConfig({ tempStorage: false });
  });

  describe("API Authentication", () => {
    test("should reject request without API key", async () => {
      const response = await request(app).get("/api/url/test.jpg");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("API key is required");
    });

    test("should reject request with invalid API key", async () => {
      const response = await request(app)
        .get("/api/url/test.jpg")
        .set("x-api-key", "invalid-key");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid API key");
    });

    test("should accept request with valid API key", async () => {
      const response = await request(app)
        .get("/api/url/test.jpg")
        .set("x-api-key", apiKey);

      // 即使文件不存在，但认证应该是成功的
      // 所以我们期望得到404而不是401
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("File not found");
    });
  });

  describe("Permanent Storage Mode", () => {
    test("should upload file successfully", async () => {
      const response = await request(app)
        .post("/api/upload")
        .set("x-api-key", apiKey)
        .attach("image", testImagePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.url).toMatch(/^http:\/\/.*\/api\/file\/.+$/);
    });

    test("should download uploaded file", async () => {
      const uploadResponse = await request(app)
        .post("/api/upload")
        .set("x-api-key", apiKey)
        .attach("image", testImagePath);

      const token = uploadResponse.body.url.split("/").pop();
      const downloadResponse = await request(app)
        .get(`/api/file/${token}`)
        .set("x-api-key", apiKey);

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers["content-type"]).toMatch(/^image\//);
    });

    test("should return 404 for non-existent file", async () => {
      const response = await request(app)
        .get("/api/url/non-existent.jpg")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("File not found");
    });

    test("should reject expired URL", async () => {
      const expiredToken = jwt.sign(
        {
          filepath: testImagePath,
          exp: Math.floor(Date.now() / 1000) - 3600,
        },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .get(`/api/file/${expiredToken}`)
        .set("x-api-key", apiKey);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid or expired token");
    });
  });

  describe("Temporary Storage Mode", () => {
    beforeEach(() => {
      config.updateConfig({ tempStorage: true });
    });

    test("should upload temporary file", async () => {
      const response = await request(app)
        .post("/api/upload")
        .set("x-api-key", apiKey)
        .attach("image", testImagePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.url).toMatch(/^http:\/\/.*\/api\/file\/.+$/);
    });

    test("should return 404 when accessing temp file through url endpoint", async () => {
      const response = await request(app)
        .get("/api/url/temp.jpg")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("File not found");
    });

    test("should access temp file immediately after upload", async () => {
      const uploadResponse = await request(app)
        .post("/api/upload")
        .set("x-api-key", apiKey)
        .attach("image", testImagePath);

      expect(uploadResponse.status).toBe(200);

      const token = uploadResponse.body.url.split("/").pop();
      const downloadResponse = await request(app)
        .get(`/api/file/${token}`)
        .set("x-api-key", apiKey);

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers["content-type"]).toMatch(/^image\//);
    });
  });

  describe("OSS Storage Mode", () => {
    beforeEach(() => {
      // 确保使用 OSS 存储
      config.updateConfig({ storageStrategy: "oss" });
    });

    afterEach(() => {
      // 测试后恢复为本地存储
      config.updateConfig({ storageStrategy: "local" });
    });

    describe("Permanent Storage", () => {
      beforeEach(() => {
        config.updateConfig({ tempStorage: false });
      });

      test("should upload file successfully", async () => {
        const response = await request(app)
          .post("/api/upload")
          .set("x-api-key", apiKey)
          .attach("image", testImagePath);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.url).toMatch(/^http:\/\/.*\.aliyuncs\.com\/.+$/);
      });

      test("should get permanent file url", async () => {
        // 先上传文件
        const uploadResponse = await request(app)
          .post("/api/upload")
          .set("x-api-key", apiKey)
          .attach("image", testImagePath);

        // 获取上传的文件名
        const uploadedUrl = uploadResponse.body.url;
        const filename = uploadedUrl.split("/").pop();

        // 通过 url 接口获取文件
        const response = await request(app)
          .get(`/api/url/${filename}`)
          .set("x-api-key", apiKey);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.url).toMatch(/^http:\/\/.*\.aliyuncs\.com\/.+$/);
      });

      test("should return 404 for non-existent file", async () => {
        const response = await request(app)
          .get("/api/url/non-existent.jpg")
          .set("x-api-key", apiKey);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("File not found");
      });
    });

    describe("Temporary Storage", () => {
      beforeEach(() => {
        config.updateConfig({ tempStorage: true });
      });

      test("should upload temporary file", async () => {
        const response = await request(app)
          .post("/api/upload")
          .set("x-api-key", apiKey)
          .attach("image", testImagePath);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.url).toMatch(/^http:\/\/.*\.aliyuncs\.com\/.+$/);
      });

      test("should return 404 when accessing temp file through url endpoint", async () => {
        const response = await request(app)
          .get("/api/url/temp.jpg")
          .set("x-api-key", apiKey);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("File not found");
      });

      test("should generate temporary url for uploaded file", async () => {
        const uploadResponse = await request(app)
          .post("/api/upload")
          .set("x-api-key", apiKey)
          .attach("image", testImagePath);

        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.body.url).toMatch(
          /^http:\/\/.*\.aliyuncs\.com\/.+\?.*Expires=.+$/
        );
      });
    });
  });
});
