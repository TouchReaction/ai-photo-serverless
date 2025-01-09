const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const app = require('../src/app');
const ConfigManager = require('../src/config/config');
const jwt = require('jsonwebtoken');

describe('Storage API Tests', () => {
    const testImagePath = path.resolve(__dirname, './fixtures/test.jpg');
    const config = ConfigManager.getInstance();
    
    beforeAll(async () => {
        // 创建测试图片
        await fs.writeFile(testImagePath, 'fake image content');
    });

    afterAll(async () => {
        // 清理测试图片
        await fs.unlink(testImagePath);
    });

    beforeEach(() => {
        // 重置为永久保存模式
        config.updateConfig({ tempStorage: false });
    });

    describe('Permanent Storage Mode', () => {
        test('should upload file successfully', async () => {
            const response = await request(app)
                .post('/api/upload')
                .attach('image', testImagePath);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.filename).toBe('test.jpg');
            expect(response.body.url).toMatch(/^http:\/\/.*\/api\/file\/.+$/);
        });

        test('should download uploaded file', async () => {
            // 先上传文件
            const uploadResponse = await request(app)
                .post('/api/upload')
                .attach('image', testImagePath);

            // 获取文件URL
            const urlResponse = await request(app)
                .get(`/api/url/${uploadResponse.body.filename}`);

            expect(urlResponse.status).toBe(200);
            expect(urlResponse.body.success).toBe(true);
            expect(urlResponse.body.url).toMatch(/^http:\/\/.*\/api\/file\/.+$/);

            // 下载文件
            const token = urlResponse.body.url.split('/').pop();
            const downloadResponse = await request(app)
                .get(`/api/file/${token}`);

            expect(downloadResponse.status).toBe(200);
            expect(downloadResponse.headers['content-type']).toMatch(/^image\//);
        });

        test('should return 404 for non-existent file', async () => {
            const response = await request(app)
                .get('/api/url/non-existent.jpg');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('File not found');
        });

        test('should reject expired URL', async () => {
            // 生成一个已过期的token
            const expiredToken = jwt.sign({
                filepath: testImagePath,
                exp: Math.floor(Date.now() / 1000) - 3600 // 1小时前过期
            }, process.env.JWT_SECRET);

            const response = await request(app)
                .get(`/api/file/${expiredToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid or expired token');
        });
    });

    describe('Temporary Storage Mode', () => {
        beforeEach(() => {
            config.updateConfig({ tempStorage: true });
        });

        test('should upload temporary file', async () => {
            const response = await request(app)
                .post('/api/upload')
                .attach('image', testImagePath);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.filename).toBe('temp.jpg');
            expect(response.body.url).toMatch(/^http:\/\/.*\/api\/file\/.+$/);
        });

        test('should return 404 when accessing temp file through url endpoint', async () => {
            const response = await request(app)
                .get('/api/url/temp.jpg');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('File not found');
        });

        test('should access temp file immediately after upload', async () => {
            // 上传文件
            const uploadResponse = await request(app)
                .post('/api/upload')
                .attach('image', testImagePath);

            expect(uploadResponse.status).toBe(200);

            // 使用返回的URL直接访问文件
            const token = uploadResponse.body.url.split('/').pop();
            const downloadResponse = await request(app)
                .get(`/api/file/${token}`);

            expect(downloadResponse.status).toBe(200);
            expect(downloadResponse.headers['content-type']).toMatch(/^image\//);
        });
    });
}); 