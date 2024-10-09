import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import { open } from 'sqlite';

const createDatabase = async () => {
  // Open a database connection
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Students (
      USN TEXT PRIMARY KEY,
      Email TEXT UNIQUE NOT NULL,
      Name TEXT NOT NULL,
      Branch TEXT NOT NULL,
      Section TEXT NOT NULL,
      Batch INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Teachers (
      TID TEXT PRIMARY KEY,
      Email TEXT UNIQUE NOT NULL,
      Name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Auth (
      Email TEXT PRIMARY KEY NOT NULL,
      Password_Enc TEXT NOT NULL,
      Role TEXT NOT NULL CHECK (Role IN ('t', 's', 'a'))
    );

    CREATE TABLE IF NOT EXISTS Teaches (
      TID TEXT NOT NULL,
      SID TEXT NOT NULL,
      Section TEXT NOT NULL,
      PRIMARY KEY (TID, SID, Section),
      FOREIGN KEY (TID) REFERENCES Teachers(TID),
      FOREIGN KEY (SID) REFERENCES Subjects(SID)
    );

    CREATE TABLE IF NOT EXISTS Subjects (
      SID TEXT PRIMARY KEY,
      SName TEXT NOT NULL,
      Branch TEXT NOT NULL,
      Batch INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Marks (
      USN TEXT NOT NULL,
      SID TEXT NOT NULL,
      Type TEXT NOT NULL CHECK (Type IN ('I1', 'I2', 'I3', 'E')),
      Marks INTEGER NOT NULL,
      MaxMarks INTEGER NOT NULL,
      PRIMARY KEY (USN, SID, Type),
      FOREIGN KEY (USN) REFERENCES Students(USN),
      FOREIGN KEY (SID) REFERENCES Subjects(SID)
    );

    CREATE TABLE IF NOT EXISTS Attendance (
      Date TEXT NOT NULL,
      USN TEXT NOT NULL,
      SID TEXT NOT NULL,
      Status BOOLEAN NOT NULL,
      PRIMARY KEY (Date, USN, SID),
      FOREIGN KEY (USN) REFERENCES Students(USN),
      FOREIGN KEY (SID) REFERENCES Subjects(SID)
    );
  `);

  // Encrypt the passwords
  const adminPassword = await bcrypt.hash('adminpassword', 10);
  const teacherPassword = await bcrypt.hash('teacherpassword', 10);
  const studentPassword = await bcrypt.hash('studentpassword', 10);

  // Insert dummy data
  await db.exec(`
    INSERT INTO Students (USN, Email, Name, Branch, Section, Batch)
    VALUES 
    ('1JS20IS001', 'student1@example.com', 'Student 1', 'CSE', 'A', 2024),
    ('1JS20IS002', 'student2@example.com', 'Student 2', 'CSE', 'A', 2024),
    ('1JS20IS003', 'student3@example.com', 'Student 3', 'CSE', 'A', 2024),
    ('1JS20IS004', 'student4@example.com', 'Student 4', 'CSE', 'A', 2024),
    ('1JS20IS005', 'student5@example.com', 'Student 5', 'CSE', 'A', 2024);

    INSERT INTO Teachers (TID, Email, Name)
    VALUES ('017CS', 'teacher@example.com', 'Jane Smith');

    INSERT INTO Auth (Email, Password_Enc, Role)
    VALUES 
    ('admin@example.com', '${adminPassword}', 'a'),
    ('teacher@example.com', '${teacherPassword}', 't'),
    ('student1@example.com', '${studentPassword}', 's'),
    ('student2@example.com', '${studentPassword}', 's'),
    ('student3@example.com', '${studentPassword}', 's'),
    ('student4@example.com', '${studentPassword}', 's'),
    ('student5@example.com', '${studentPassword}', 's');

    INSERT INTO Subjects (SID, SName, Branch, Batch)
    VALUES
    ('CS857', 'Computer Networks', 'CSE', 2024),
    ('CS863', 'OS', 'ISE', 2022);

    INSERT INTO Teaches (TID, SID, Section)
    VALUES ('017CS', 'CS857', 'A');

    INSERT INTO Marks (USN, SID, Type, Marks, MaxMarks)
    VALUES 
    ('1JS20IS001', 'CS857', 'I1', 85, 100),
    ('1JS20IS001', 'CS857', 'I2', 78, 100),
    ('1JS20IS002', 'CS857', 'I1', 90, 100),
    ('1JS20IS002', 'CS857', 'I2', 82, 100),
    ('1JS20IS003', 'CS857', 'I1', 88, 100),
    ('1JS20IS003', 'CS857', 'I2', 79, 100),
    ('1JS20IS004', 'CS857', 'I1', 92, 100),
    ('1JS20IS004', 'CS857', 'I2', 85, 100),
    ('1JS20IS005', 'CS857', 'I1', 91, 100),
    ('1JS20IS005', 'CS857', 'I2', 83, 100);

    INSERT INTO Attendance (Date, USN, SID, Status)
    VALUES 
    ('2023-07-12', '1JS20IS001', 'CS857', 1),
    ('2023-07-12', '1JS20IS002', 'CS857', 0),
    ('2023-07-12', '1JS20IS003', 'CS857', 1),
    ('2023-07-12', '1JS20IS004', 'CS857', 0),
    ('2023-07-12', '1JS20IS005', 'CS857', 1);
  `);

  console.log("Database setup completed with dummy data.");
};

// Run the function to create the database and tables
createDatabase().catch((err) => {
  console.error("Error creating database:", err);
});
