const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const User = require('./userRepository');

const Submission = sequelize.define('Submission', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    remark: DataTypes.TEXT,
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    assignmentId: { type: DataTypes.INTEGER, allowNull: false }
});

// Define associations
Submission.belongsTo(User, { 
    foreignKey: 'studentId', 
    as: 'student' 
});

// Assignment association will be defined in assignmentRepository to avoid circular dependency

module.exports = Submission;

