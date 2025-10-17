const { gql } = require('apollo-server-express');

const typeDefs = gql`
    enum Role { TUTOR, STUDENT }
    type User { id: ID!, username: String!, role: Role! }
    type Assignment { id: ID!, description: String!, publishedAt: String, deadline: String, students: [User], submissions: [Submission] }
    type Submission { id: ID!, remark: String!, student: User! }

    type AuthPayload { token: String!, user: User! }

    type Query {
        assignment(id: ID!): Assignment
    }

    type Mutation {
        login(username: String!, role: Role!): AuthPayload
        createAssignment(description: String!, studentIds: [ID], publishedAt: String, deadline: String): Assignment
        submitAssignment(assignmentId: ID!, remark: String!): Submission
    }
`;

module.exports = typeDefs;
