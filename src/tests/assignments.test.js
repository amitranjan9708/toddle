const request = require('supertest');
const createServer = require('../app');
const sequelize = require('../utils/db');
const User = require('../repositories/userRepository');

describe('Assignments', () => {
    let app;
    let server;
    let tutorToken;
    let studentToken;
    let tutorId;
    let studentId;

    beforeAll(async () => {
        app = await createServer();
        server = app.listen(0);
        await sequelize.sync({ force: true });

        // Create test users and get tokens
        const tutorResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'test_tutor',
                role: 'TUTOR'
            });
        tutorToken = tutorResponse.body.data.token;
        tutorId = tutorResponse.body.data.user.id;

        const studentResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'test_student',
                role: 'STUDENT'
            });
        studentToken = studentResponse.body.data.token;
        studentId = studentResponse.body.data.user.id;
    });

    afterAll(async () => {
        await server.close();
        await sequelize.close();
    });

    describe('POST /api/assignments', () => {
        it('should create assignment successfully (tutor)', async () => {
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
            const deadlineDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next week
            
            const response = await request(app)
                .post('/api/assignments')
                .set('Authorization', `Bearer ${tutorToken}`)
                .send({
                    description: 'Complete the math homework on algebra',
                    studentIds: [studentId],
                    publishedAt: futureDate.toISOString(),
                    deadline: deadlineDate.toISOString()
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.description).toBe('Complete the math homework on algebra');
            expect(response.body.data.tutorId).toBe(tutorId);
        });

        it('should return 403 for student trying to create assignment', async () => {
            const response = await request(app)
                .post('/api/assignments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    description: 'Test assignment',
                    studentIds: [studentId]
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .post('/api/assignments')
                .send({
                    description: 'Test assignment'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for missing description', async () => {
            const response = await request(app)
                .post('/api/assignments')
                .set('Authorization', `Bearer ${tutorToken}`)
                .send({
                    studentIds: [studentId]
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/assignments/feed', () => {
        it('should get assignment feed for tutor', async () => {
            const response = await request(app)
                .get('/api/assignments/feed')
                .set('Authorization', `Bearer ${tutorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.assignments).toBeDefined();
            expect(response.body.data.pagination).toBeDefined();
        });

        it('should get assignment feed for student', async () => {
            const response = await request(app)
                .get('/api/assignments/feed')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.assignments).toBeDefined();
        });

        it('should filter by publishedAt', async () => {
            const response = await request(app)
                .get('/api/assignments/feed?publishedAt=ONGOING')
                .set('Authorization', `Bearer ${tutorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('POST /api/assignments/submit', () => {
        let assignmentId;

        beforeEach(async () => {
            // Create an assignment for testing
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
            const deadlineDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next week
            
            const assignmentResponse = await request(app)
                .post('/api/assignments')
                .set('Authorization', `Bearer ${tutorToken}`)
                .send({
                    description: 'Test assignment for submission',
                    studentIds: [studentId],
                    publishedAt: futureDate.toISOString(),
                    deadline: deadlineDate.toISOString()
                });
            assignmentId = assignmentResponse.body.data.id;
        });

        it('should submit assignment successfully (student)', async () => {
            const response = await request(app)
                .post('/api/assignments/submit')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    assignmentId: assignmentId,
                    remark: 'I have completed the assignment with all required calculations.'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.remark).toBe('I have completed the assignment with all required calculations.');
            expect(response.body.data.studentId).toBe(studentId);
        });

        it('should return 403 for tutor trying to submit', async () => {
            const response = await request(app)
                .post('/api/assignments/submit')
                .set('Authorization', `Bearer ${tutorToken}`)
                .send({
                    assignmentId: assignmentId,
                    remark: 'Test submission'
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for missing remark', async () => {
            const response = await request(app)
                .post('/api/assignments/submit')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    assignmentId: assignmentId
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
