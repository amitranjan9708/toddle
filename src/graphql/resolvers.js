const AuthService = require('../services/authService');
const AssignmentService = require('../services/assignmentService');

const resolvers = {
    Query: {
        assignment: async (_, { id }, { user }) => {
            if (!user) throw new Error('Authentication required');
            return AssignmentService.getAssignmentDetails(user.id, user.role, id);
        }
    },
    Mutation: {
         login: async (_, { username, role }) => {
             return AuthService.login(username, role);
         },
        createAssignment: async (_, args, { user }) => {
            if (!user) throw new Error('Authentication required');
            if (user.role !== 'TUTOR') throw new Error('Only tutors can create assignments');
            return AssignmentService.createAssignment(user.id, args.description, args.studentIds, args.publishedAt, args.deadline);
        },
        submitAssignment: async (_, args, { user }) => {
            if (!user) throw new Error('Authentication required');
            if (user.role !== 'STUDENT') throw new Error('Only students can submit');
            return AssignmentService.addSubmission(user.id, args.assignmentId, args.remark);
        }
     }
 };

 module.exports = resolvers;
