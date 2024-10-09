import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors());

const connectDB = async () => {
	return open({
		filename: './database.sqlite',
		driver: sqlite3.Database
	});
};

// Middleware to authenticate JWT
const authenticateJWT = (req: express.Request | any, res: express.Response, next: express.NextFunction) => {
	const token = req.header('Authorization')?.split(' ')[1];

	if (token) {
		jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
			if (err) {
				return res.status(403).json({ message: 'Forbidden' });
			}
			req.user = user;
			next();
		});
	} else {
		res.status(401).json({ message: 'Unauthorized' });
	}
};

// Route to handle login
app.post('/auth/login', async (req, res) => {
	const { email, password } = req.body;
	const db = await connectDB();

	const user = await db.get('SELECT * FROM Auth WHERE Email = ?', email);
	if (user && bcrypt.compareSync(password, user.Password_Enc)) {
		const token = jwt.sign({ email: user.Email, role: user.Role }, process.env.JWT_SECRET!, { expiresIn: '1y' });
		res.json({ token, role: user.Role });
	} else {
		res.status(401).json({ message: 'Invalid credentials' });
	}
});

// Route to return the number of teachers
app.get('/teachers/count', authenticateJWT, async (req, res) => {
	const db = await connectDB();
	const count = await db.get('SELECT COUNT(*) AS count FROM Teachers');
	res.json(count);
});

// Route to return the number of students
app.get('/students/count', authenticateJWT, async (req, res) => {
	const db = await connectDB();
	const count = await db.get('SELECT COUNT(*) AS count FROM Students');
	res.json(count);
});

// Route to return all students
app.get('/students', authenticateJWT, async (req, res) => {
	const db = await connectDB();
	const students = await db.all('SELECT * FROM Students');
	res.json(students);
});

// Route to return all teachers
app.get('/teachers', authenticateJWT, async (req, res) => {
	const db = await connectDB();
	const teachers = await db.all('SELECT * FROM Teachers');
	res.json(teachers);
});

// CRUD routes for students
app.get('/students/:usn', authenticateJWT, async (req, res) => {
	const { usn } = req.params;
	const db = await connectDB();

	const student = await db.get('SELECT * FROM Students WHERE USN = ?', usn);
	if (student) {
		res.json(student);
	} else {
		res.status(404).json({ message: 'Student not found' });
	}
});

app.post('/students', authenticateJWT, async (req, res) => {
	const { usn, email, name, branch, section, batch } = req.body;
	const db = await connectDB();

	await db.run(
		'INSERT INTO Students (USN, Email, Name, Branch, Section, Batch) VALUES (?, ?, ?, ?, ?, ?)',
		[usn, email, name, branch, section, batch]
	);
	res.status(201).json({ message: 'Student created' });
});

app.get('/teacher/tid', authenticateJWT, async (req, res) => {
	//@ts-ignore
	const { email } = req.user;
	const db = await connectDB();

	try {
		const teacher = await db.get('SELECT TID FROM Teachers WHERE Email = ?', email);
		if (!teacher) {
			return res.status(404).json({ message: 'Teacher not found' });
		}
		res.json({ TID: teacher.TID });
	} catch (error) {
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.get('/teacher/subjects/:tid', authenticateJWT, async (req, res) => {
	const { tid } = req.params;
	const db = await connectDB();

	try {
		const subjects = await db.all(`
      SELECT s.SID, s.SName, s.Branch, s.Batch, t.Section
      FROM Teaches t
      JOIN Subjects s ON t.SID = s.SID
      WHERE t.TID = ?
    `, tid);
		res.json(subjects);
	} catch (error) {
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.post('/teacher/marks', authenticateJWT, async (req, res) => {
	const marksRecords = req.body;
	const db = await connectDB();
	console.log("records::", marksRecords.length);

	try {
		// @ts-ignore
		const promises = marksRecords.map(async (mark: any) => {
			await db.run(`
        INSERT INTO Marks (USN, SID, Type, Marks, MaxMarks)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(USN, SID, Type) DO UPDATE SET
          Marks = excluded.Marks,
          MaxMarks = excluded.MaxMarks
      `, [mark.USN, mark.SID, mark.Type, mark.Marks, mark.MaxMarks]);
		});

		await Promise.all(promises);

		res.status(200).json({ message: 'Marks submitted successfully' });
	} catch (error) {
		console.error('Error submitting marks:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});


// Example route to fetch maximum marks for a subject and exam type
app.get('/teacher/marks/:sid/:type/maxmarks', authenticateJWT, async (req, res) => {
	const { sid, type } = req.params;
	const db = await connectDB();

	console.log("dumbo", sid, type);
	try {
		const result = await db.get(`
      SELECT MaxMarks
      FROM Marks
      WHERE SID = ? AND Type = ?
    `, [sid, type]);

		if (result) {
			res.status(200).json({ MaxMarks: result.MaxMarks });
		} else {
			res.status(404).json({ message: 'Max marks not found' });
		}
	} catch (error) {
		console.error('Error fetching max marks:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

// Example route to fetch initial marks for a subject and exam type
app.get('/teacher/marks/:sid/:type/initial', authenticateJWT, async (req, res) => {
	const { sid, type } = req.params;
	const db = await connectDB();

	try {
		const results = await db.all(`
      SELECT USN, Marks
      FROM Marks
      WHERE SID = ? AND Type = ?
    `, [sid, type]);

		res.status(200).json(results);
	} catch (error) {
		console.error('Error fetching initial marks:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.get('/student/overall-attendance', authenticateJWT, async (req, res) => {
	// @ts-ignore
	const email = req.user.email;
	const { SID } = req.query;
	const db = await connectDB();

	try {
		const student = await db.get('SELECT USN FROM Students WHERE Email = ?', [email]);

		if (!student) {
			return res.status(404).json({ message: 'Student not found' });
		}

		const overallAttendance = await db.all(`
      SELECT Status FROM Attendance 
      WHERE USN = ? AND SID = ?
    `, [student.USN, SID]);

		res.status(200).json(overallAttendance);
	} catch (error) {
		console.error('Error fetching overall attendance:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.get('/student/attendance', authenticateJWT, async (req, res) => {
	// @ts-ignore
	const email = req.user.email;
	const { SID, year, month } = req.query;
	const db = await connectDB();

	try {
		const student = await db.get('SELECT USN FROM Students WHERE Email = ?', [email]);

		if (!student) {
			return res.status(404).json({ message: 'Student not found' });
		}

		// Fetch attendance records for the given year
		const attendanceRecords = await db.all(`
      SELECT Date, Status FROM Attendance 
      WHERE USN = ? AND SID = ? AND Date LIKE ?
    `, [student.USN, SID, `${year}-%`]);

		// Filter records for the specified month in JavaScript
		const filteredRecords = attendanceRecords.filter(record => {
			const recordMonth = new Date(record.Date).getMonth() + 1;
			// @ts-ignore
			return recordMonth === parseInt(month, 10);
		});

		res.status(200).json(filteredRecords);
	} catch (error) {
		console.error('Error fetching attendance:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.get('/student/marks', authenticateJWT, async (req, res) => {
	// @ts-ignore
	const email = req.user.email;
	const { SID } = req.query;
	const db = await connectDB();

	try {
		const student = await db.get('SELECT USN FROM Students WHERE Email = ?', [email]);

		if (!student) {
			return res.status(404).json({ message: 'Student not found' });
		}

		const marksRecords = await db.all(`
      SELECT Type, Marks, MaxMarks FROM Marks 
      WHERE USN = ? AND SID = ?
    `, [student.USN, SID]);

		res.status(200).json(marksRecords);
	} catch (error) {
		console.error('Error fetching marks:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.get('/student/subjects', authenticateJWT, async (req, res) => {
	// @ts-ignore
	const email = req.user.email;
	const db = await connectDB();

	try {
		const student = await db.get('SELECT Branch, Batch FROM Students WHERE Email = ?', [email]);

		if (!student) {
			return res.status(404).json({ message: 'Student not found' });
		}

		const subjects = await db.all('SELECT SID, SName FROM Subjects WHERE Branch = ? AND Batch = ?', [student.Branch, student.Batch]);

		res.status(200).json(subjects);
	} catch (error) {
		console.error('Error fetching subjects:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.get('/teacher/attendance/:sid/:date', authenticateJWT, async (req, res) => {
	const { sid, date } = req.params;
	const db = await connectDB();

	try {
		const attendanceRecords = await db.all(`
      SELECT USN, Status
      FROM Attendance
      WHERE SID = ? AND Date = ?
    `, [sid, date]);

		res.status(200).json(attendanceRecords);
	} catch (error) {
		console.error('Error fetching initial attendance:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

app.post('/teacher/attendance', authenticateJWT, async (req, res) => {
	const attendanceData = req.body; // Assuming req.body is an array of attendance objects
	const db = await connectDB();

	try {
		const sqliteVersion = await db.get('SELECT SQLITE_VERSION() AS version');
		const sqliteVersionNumber = parseFloat(sqliteVersion.version.split('.')[0]);

		if (sqliteVersionNumber >= 3.35) {
			// Use ON CONFLICT DO UPDATE for SQLite 3.35+
			// @ts-ignore
			const promises = attendanceData.map(({ Date, USN, SID, Status }) =>
				db.run(`
          INSERT INTO Attendance (Date, USN, SID, Status)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(Date, USN, SID) DO UPDATE SET
            Status = excluded.Status
        `, [Date, USN, SID, Status])
			);

			await Promise.all(promises);
		} else {
			// Fallback to alternative method for conflict resolution if needed
			// @ts-ignore
			const promises = attendanceData.map(({ Date, USN, SID, Status }) =>
				db.run(`
          INSERT OR REPLACE INTO Attendance (Date, USN, SID, Status)
          VALUES (?, ?, ?, ?)
        `, [Date, USN, SID, Status])
			);

			await Promise.all(promises);
		}

		res.status(200).json({ message: 'Attendance updated successfully' });
	} catch (error) {
		console.error('Error updating attendance:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});


app.put('/students/:usn', authenticateJWT, async (req, res) => {
	const { usn } = req.params;
	const { email, name, branch, section, batch } = req.body;
	const db = await connectDB();

	await db.run(
		'UPDATE Students SET Email = ?, Name = ?, Branch = ?, Section = ?, Batch = ? WHERE USN = ?',
		[email, name, branch, section, batch, usn]
	);
	res.json({ message: 'Student updated' });
});

app.delete('/students/:usn', authenticateJWT, async (req, res) => {
	const { usn } = req.params;
	const db = await connectDB();

	await db.run('DELETE FROM Students WHERE USN = ?', usn);
	res.json({ message: 'Student deleted' });
});

// CRUD routes for teachers
app.get('/teachers/:tid', authenticateJWT, async (req, res) => {
	const { tid } = req.params;
	const db = await connectDB();

	const teacher = await db.get('SELECT * FROM Teachers WHERE TID = ?', tid);
	if (teacher) {
		res.json(teacher);
	} else {
		res.status(404).json({ message: 'Teacher not found' });
	}
});

app.post('/teachers', authenticateJWT, async (req, res) => {
	const { tid, email, name } = req.body;
	const db = await connectDB();

	await db.run(
		'INSERT INTO Teachers (TID, Email, Name) VALUES (?, ?, ?)',
		[tid, email, name]
	);
	res.status(201).json({ message: 'Teacher created' });
});

app.put('/teachers/:tid', authenticateJWT, async (req, res) => {
	const { tid } = req.params;
	const { email, name } = req.body;
	const db = await connectDB();

	await db.run(
		'UPDATE Teachers SET Email = ?, Name = ? WHERE TID = ?',
		[email, name, tid]
	);
	res.json({ message: 'Teacher updated' });
});

app.delete('/teachers/:tid', authenticateJWT, async (req, res) => {
	const { tid } = req.params;
	const db = await connectDB();

	await db.run('DELETE FROM Teachers WHERE TID = ?', tid);
	res.json({ message: 'Teacher deleted' });
});

// CRUD routes for subjects
app.get('/subjects/:sid', authenticateJWT, async (req, res) => {
	const { sid } = req.params;
	const db = await connectDB();

	const subject = await db.get('SELECT * FROM Subjects WHERE SID = ?', sid);
	if (subject) {
		res.json(subject);
	} else {
		res.status(404).json({ message: 'Subject not found' });
	}
});

app.post('/subjects', authenticateJWT, async (req, res) => {
	const { sid, sname } = req.body;
	const db = await connectDB();

	await db.run(
		'INSERT INTO Subjects (SID, SName) VALUES (?, ?)',
		[sid, sname]
	);
	res.status(201).json({ message: 'Subject created' });
});

app.put('/subjects/:sid', authenticateJWT, async (req, res) => {
	const { sid } = req.params;
	const { sname } = req.body;
	const db = await connectDB();

	await db.run(
		'UPDATE Subjects SET SName = ? WHERE SID = ?',
		[sname, sid]
	);
	res.json({ message: 'Subject updated' });
});

app.delete('/subjects/:sid', authenticateJWT, async (req, res) => {
	const { sid } = req.params;
	const db = await connectDB();

	await db.run('DELETE FROM Subjects WHERE SID = ?', sid);
	res.json({ message: 'Subject deleted' });
});

// CRUD routes for marks
app.get('/marks/:usn/:sid/:type', authenticateJWT, async (req, res) => {
	const { usn, sid, type } = req.params;
	const db = await connectDB();

	const marks = await db.get('SELECT * FROM Marks WHERE USN = ? AND SID = ? AND Type = ?', [usn, sid, type]);
	if (marks) {
		res.json(marks);
	} else {
		res.status(404).json({ message: 'Marks not found' });
	}
});

app.post('/marks', authenticateJWT, async (req, res) => {
	const { usn, sid, type, marks, maxMarks } = req.body;
	const db = await connectDB();

	await db.run(
		'INSERT INTO Marks (USN, SID, Type, Marks, MaxMarks) VALUES (?, ?, ?, ?, ?)',
		[usn, sid, type, marks, maxMarks]
	);
	res.status(201).json({ message: 'Marks created' });
});

app.put('/marks/:usn/:sid/:type', authenticateJWT, async (req, res) => {
	const { usn, sid, type } = req.params;
	const { marks, maxMarks } = req.body;
	const db = await connectDB();

	await db.run(
		'UPDATE Marks SET Marks = ?, MaxMarks = ? WHERE USN = ? AND SID = ? AND Type = ?',
		[marks, maxMarks, usn, sid, type]
	);
	res.json({ message: 'Marks updated' });
});

app.delete('/marks/:usn/:sid/:type', authenticateJWT, async (req, res) => {
	const { usn, sid, type } = req.params;
	const db = await connectDB();

	await db.run('DELETE FROM Marks WHERE USN = ? AND SID = ? AND Type = ?', [usn, sid, type]);
	res.json({ message: 'Marks deleted' });
});

// CRUD routes for attendance
app.get('/attendance/:date/:usn/:sid/:tid', authenticateJWT, async (req, res) => {
	const { date, usn, sid, tid } = req.params;
	const db = await connectDB();

	const attendance = await db.get('SELECT * FROM Attendance WHERE Date = ? AND USN = ? AND SID = ? AND TID = ?', [date, usn, sid, tid]);
	if (attendance) {
		res.json(attendance);
	} else {
		res.status(404).json({ message: 'Attendance not found' });
	}
});

app.post('/attendance', authenticateJWT, async (req, res) => {
	const { date, usn, sid, tid, status } = req.body;
	const db = await connectDB();

	await db.run(
		'INSERT INTO Attendance (Date, USN, SID, TID, Status) VALUES (?, ?, ?, ?, ?)',
		[date, usn, sid, tid, status]
	);
	res.status(201).json({ message: 'Attendance created' });
});

app.put('/attendance/:date/:usn/:sid/:tid', authenticateJWT, async (req, res) => {
	const { date, usn, sid, tid } = req.params;
	const { status } = req.body;
	const db = await connectDB();

	await db.run(
		'UPDATE Attendance SET Status = ? WHERE Date = ? AND USN = ? AND SID = ? AND TID = ?',
		[status, date, usn, sid, tid]
	);
	res.json({ message: 'Attendance updated' });
});

app.delete('/attendance/:date/:usn/:sid/:tid', authenticateJWT, async (req, res) => {
	const { date, usn, sid, tid } = req.params;
	const db = await connectDB();

	await db.run('DELETE FROM Attendance WHERE Date = ? AND USN = ? AND SID = ? AND TID = ?', [date, usn, sid, tid]);
	res.json({ message: 'Attendance deleted' });
});

// Function to setup database and insert dummy data
const setupDatabase = async () => {
	console.log("Database setup completed with dummy data.");
};

// Set up the database and start the server
setupDatabase().then(() => {
	const PORT = process.env.PORT || 5000;
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}).catch((err) => {
	console.error("Error setting up the database:", err);
});
