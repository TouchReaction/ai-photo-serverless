const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const app = require('../src/app');
const ConfigManager = require('../src/config/config');
const jwt = require('jsonwebtoken');

describe('Storage API Tests', () => {
    const testFixturesDir = path.resolve(__dirname, './fixtures');
    const testImagePath = path.join(testFixturesDir, 'test.jpg');
    const uploadTestDir = path.resolve(__dirname, '../uploads/test');
    const config = ConfigManager.getInstance();
    
    async function removeDir(dir) {
        try {
            await fs.rm(dir, { recursive: true, force: true });
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    beforeAll(async () => {
        // 创建测试目录和文件
        await fs.mkdir(testFixturesDir, { recursive: true });
        await fs.writeFile(testImagePath, 'fake image content');
    });

    afterAll(async () => {
        // 清理测试文件和目录
        await removeDir(testFixturesDir);
        await removeDir(uploadTestDir);
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
            expect(response.body.url).toMatch(/^http:\/\/.*\/api\/file\/.+$/);
        });

        test('should download uploaded file', async () => {
            const uploadResponse = await request(app)
                .post('/api/upload')
                .attach('image', testImagePath);

            const token = uploadResponse.body.url.split('/').pop();
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
            const expiredToken = jwt.sign({
                filepath: testImagePath,
                exp: Math.floor(Date.now() / 1000) - 3600
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
            const uploadResponse = await request(app)
                .post('/api/upload')
                .attach('image', testImagePath);

            expect(uploadResponse.status).toBe(200);

            const token = uploadResponse.body.url.split('/').pop();
            const downloadResponse = await request(app)
                .get(`/api/file/${token}`);

            expect(downloadResponse.status).toBe(200);
            expect(downloadResponse.headers['content-type']).toMatch(/^image\//);
        });
    });
}); 