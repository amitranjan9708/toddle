const request = require('supertest');
const createServer = require('../app');
const sequelize = require('../utils/db');

describe('Authentication', () => {
    let app;
    let server;

    beforeAll(async () => {
        app = await createServer();
        server = app.listen(0); // Use random port for testing
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await server.close();
        await sequelize.close();
    });

    describe('POST /api/auth/login', () => {
        it('should login a tutor successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'john_tutor',
                    role: 'TUTOR'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.username).toBe('john_tutor');
            expect(response.body.data.user.role).toBe('TUTOR');
            expect(response.body.data.token).toBeDefined();
        });

        it('should login a student successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'jane_student',
                    role: 'STUDENT'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.username).toBe('jane_student');
            expect(response.body.data.user.role).toBe('STUDENT');
            expect(response.body.data.token).toBeDefined();
        });

        it('should return existing user if username already exists', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'john_tutor',
                    role: 'TUTOR'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.user.username).toBe('john_tutor');
        });

        it('should return 400 for missing username', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    role: 'TUTOR'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for missing role', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'test_user'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for invalid role', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'test_user',
                    role: 'INVALID_ROLE'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for username too short', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'ab',
                    role: 'TUTOR'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
