const AssignmentService = require('../services/assignmentService');

class AssignmentController {
    // Create assignment (Tutor only)
    static async create(req, res) {
        const tutorId = req.user.id;
        const { description, studentIds, publishedAt, deadline } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }
        
        try {
            const assignment = await AssignmentService.createAssignment(tutorId, description, studentIds, publishedAt, deadline);
            res.status(201).json({
                success: true,
                data: assignment
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Update assignment (Tutor only)
    static async update(req, res) {
        const tutorId = req.user.id;
        const { id } = req.params;
        const { description, studentIds, publishedAt, deadline } = req.body;
        
        try {
            const assignment = await AssignmentService.updateAssignment(id, tutorId, { description, studentIds, publishedAt, deadline });
            res.json({
                success: true,
                data: assignment
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Delete assignment (Tutor only)
    static async delete(req, res) {
        const tutorId = req.user.id;
        const { id } = req.params;
        
        try {
            await AssignmentService.deleteAssignment(id, tutorId);
            res.json({
                success: true,
                message: 'Assignment deleted successfully'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Get assignment details
    static async getDetails(req, res) {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { id } = req.params;
        
        try {
            const assignment = await AssignmentService.getAssignmentDetails(userId, userRole, id);
            res.json({
                success: true,
                data: assignment
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Get assignment feed with filters
    static async getFeed(req, res) {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { publishedAt, status, page = 1, limit = 10 } = req.query;
        
        try {
            const feed = await AssignmentService.getAssignmentFeed(userId, userRole, {
                publishedAt,
                status,
                page: parseInt(page),
                limit: parseInt(limit)
            });
            res.json({
                success: true,
                data: feed
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Submit assignment (Student only)
    static async submit(req, res) {
        const studentId = req.user.id;
        const { assignmentId, remark } = req.body;
        
        if (!remark) {
            return res.status(400).json({ error: 'Remark is required' });
        }
        
        try {
            const submission = await AssignmentService.addSubmission(studentId, assignmentId, remark);
            res.status(201).json({
                success: true,
                data: submission
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Grade assignment (Tutor only)
    static async grade(req, res) {
        const tutorId = req.user.id;
        const { assignmentId, studentId, grade, feedback } = req.body;
        
        if (!grade) {
            return res.status(400).json({ error: 'Grade is required' });
        }
        
        try {
            const submission = await AssignmentService.gradeSubmission(assignmentId, studentId, tutorId, grade, feedback);
            res.json({
                success: true,
                data: submission
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = AssignmentController;
