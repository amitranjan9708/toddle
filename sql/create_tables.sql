CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    role TEXT
);

CREATE TABLE Assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    publishedAt DATETIME,
    deadline DATETIME,
    tutorId INTEGER
);

CREATE TABLE AssignmentStudents (
    AssignmentId INTEGER,
    UserId INTEGER,
    status TEXT
);

CREATE TABLE Submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remark TEXT,
    studentId INTEGER,
    assignmentId INTEGER
);
