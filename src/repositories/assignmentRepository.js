const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const User = require('./userRepository');

const Assignment = sequelize.define('Assignment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    description: DataTypes.TEXT,
    publishedAt: DataTypes.DATE,
    deadline: DataTypes.DATE,
    tutorId: { type: DataTypes.INTEGER }
});

// Many-to-many: Assignment <-> Student
const AssignmentStudent = sequelize.define('AssignmentStudent', {
    status: { type: DataTypes.ENUM('SCHEDULED','ONGOING','SUBMITTED','PENDING','OVERDUE'), defaultValue: 'SCHEDULED' }
});

Assignment.belongsToMany(User, { through: AssignmentStudent, as: 'students' });
User.belongsToMany(Assignment, { through: AssignmentStudent, as: 'assignments' });

// Define associations after all models are loaded
const defineAssociations = () => {
    const Submission = require('./submissionRepository');
    
    // Assignment has many Submissions
    Assignment.hasMany(Submission, { 
        foreignKey: 'assignmentId', 
        as: 'Submissions' 
    });
    
    // Submission belongs to Assignment
    Submission.belongsTo(Assignment, { 
        foreignKey: 'assignmentId', 
        as: 'assignment' 
    });
};

// Call this after all models are defined
setTimeout(defineAssociations, 0);

module.exports = { Assignment, AssignmentStudent };

