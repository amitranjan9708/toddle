const { Assignment, AssignmentStudent } = require('../repositories/assignmentRepository');
const Submission = require('../repositories/submissionRepository');
const User = require('../repositories/userRepository');
const { Op } = require('sequelize');

class AssignmentService {
    static async createAssignment(tutorId, description, studentIds, publishedAt, deadline) {
        const assignment = await Assignment.create({ 
            description, 
            tutorId, 
            publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
            deadline: deadline ? new Date(deadline) : null
        });
        
        if (studentIds && studentIds.length) {
            const students = await User.findAll({ where: { id: studentIds, role: 'STUDENT' } });
            if (students.length !== studentIds.length) {
                throw new Error('Some student IDs are invalid');
            }
            await assignment.addStudents(students);
        }
        
        return assignment;
    }

    static async updateAssignment(assignmentId, tutorId, updateData) {
        const assignment = await Assignment.findOne({ 
            where: { id: assignmentId, tutorId } 
        });
        
        if (!assignment) {
            throw new Error('Assignment not found or you are not authorized to update it');
        }

        const { description, studentIds, publishedAt, deadline } = updateData;
        
        await assignment.update({
            description: description || assignment.description,
            publishedAt: publishedAt ? new Date(publishedAt) : assignment.publishedAt,
            deadline: deadline ? new Date(deadline) : assignment.deadline
        });

        if (studentIds) {
            const students = await User.findAll({ where: { id: studentIds, role: 'STUDENT' } });
            await assignment.setStudents(students);
        }

        return assignment;
    }

    static async deleteAssignment(assignmentId, tutorId) {
        const assignment = await Assignment.findOne({ 
            where: { id: assignmentId, tutorId } 
        });
        
        if (!assignment) {
            throw new Error('Assignment not found or you are not authorized to delete it');
        }

        await assignment.destroy();
        return true;
    }

    static async addSubmission(studentId, assignmentId, remark) {
        // Check if assignment exists and student is assigned to it
        const assignmentStudent = await AssignmentStudent.findOne({
            where: { AssignmentId: assignmentId, UserId: studentId }
        });
        
        if (!assignmentStudent) {
            throw new Error('Assignment not found or you are not assigned to it');
        }

        const existing = await Submission.findOne({ where: { studentId, assignmentId } });
        if (existing) {
            throw new Error("Submission already exists");
        }

        const submission = await Submission.create({ remark, studentId, assignmentId });
        await AssignmentStudent.update(
            { status: 'SUBMITTED' }, 
            { where: { AssignmentId: assignmentId, UserId: studentId } }
        );
        
        return submission;
    }

    static async getAssignmentDetails(userId, role, assignmentId) {
        const assignment = await Assignment.findByPk(assignmentId, {
            include: [
                { 
                    model: User, 
                    as: 'students', 
                    attributes: ['id', 'username'],
                    through: { attributes: ['status'] }
                },
                { 
                    model: Submission, 
                    as: 'Submissions',
                    include: [{ model: User, as: 'student', attributes: ['id', 'username'] }] 
                }
            ]
        });

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        // Initialize Submissions array if it doesn't exist
        if (!assignment.Submissions) {
            assignment.Submissions = [];
        }

        // Check if user has access to this assignment
        if (role === 'STUDENT') {
            const isAssigned = assignment.students.some(student => student.id === userId);
            if (!isAssigned) {
                throw new Error('You are not assigned to this assignment');
            }
            // Filter submissions to show only student's own submission
            assignment.Submissions = assignment.Submissions.filter(s => s.student && s.student.id === userId);
        } else if (role === 'TUTOR') {
            if (assignment.tutorId !== userId) {
                throw new Error('You are not authorized to view this assignment');
            }
        }

        return assignment;
    }

    static async getAssignmentFeed(userId, role, filters = {}) {
        const { publishedAt, status, page = 1, limit = 10 } = filters;
        const offset = (page - 1) * limit;

        let whereClause = {};
        let includeClause = [];

        if (role === 'TUTOR') {
            whereClause.tutorId = userId;
            includeClause = [
                { 
                    model: User, 
                    as: 'students', 
                    attributes: ['id', 'username'],
                    through: { attributes: ['status'] }
                }
            ];
        } else if (role === 'STUDENT') {
            includeClause = [
                { 
                    model: User, 
                    as: 'students', 
                    where: { id: userId },
                    attributes: ['id', 'username'],
                    through: { attributes: ['status'] }
                }
            ];
        }

        // Apply publishedAt filter
        if (publishedAt) {
            const now = new Date();
            if (publishedAt === 'SCHEDULED') {
                whereClause.publishedAt = { [Op.gt]: now };
            } else if (publishedAt === 'ONGOING') {
                whereClause.publishedAt = { [Op.lte]: now };
            }
        }

        // Apply status filter (for students only)
        if (role === 'STUDENT' && status && status !== 'ALL') {
            if (status === 'PENDING') {
                whereClause['$students.AssignmentStudent.status$'] = { [Op.in]: ['SCHEDULED', 'ONGOING'] };
            } else if (status === 'OVERDUE') {
                whereClause.deadline = { [Op.lt]: new Date() };
                whereClause['$students.AssignmentStudent.status$'] = { [Op.in]: ['SCHEDULED', 'ONGOING'] };
            } else if (status === 'SUBMITTED') {
                whereClause['$students.AssignmentStudent.status$'] = 'SUBMITTED';
            }
        }

        const { count, rows } = await Assignment.findAndCountAll({
            where: whereClause,
            include: includeClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        return {
            assignments: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        };
    }

    static async gradeSubmission(assignmentId, studentId, tutorId, grade, feedback) {
        // Verify the assignment belongs to the tutor
        const assignment = await Assignment.findOne({ 
            where: { id: assignmentId, tutorId } 
        });
        
        if (!assignment) {
            throw new Error('Assignment not found or you are not authorized to grade this assignment');
        }

        // Find the submission
        const submission = await Submission.findOne({
            where: { assignmentId, studentId }
        });

        if (!submission) {
            throw new Error('Submission not found');
        }

        // Update the submission with grade
        await submission.update({
            grade,
            feedback: feedback || null,
            gradedAt: new Date()
        });

        return submission;
    }
}

module.exports = AssignmentService;
