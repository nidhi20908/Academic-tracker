import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const insertDummySubject = async () => {
	const db = await open({
		filename: './database.sqlite',
		driver: sqlite3.Database
	});

	try {
		// Insert the new dummy subject into the Subjects table
		await db.run(`
      INSERT INTO Subjects (SID, SName, Branch, Batch)
      VALUES ('CS858', 'Data Structures', 'CSE', 2024)
    `);

		// Insert a teaching assignment for the new subject
		await db.run(`
      INSERT INTO Teaches (TID, SID, Section)
      VALUES ('017CS', 'CS858', 'A')
    `);

		console.log("Dummy subject inserted successfully.");
	} catch (error) {
		console.error('Error inserting dummy subject:', error);
	} finally {
		await db.close();
	}
};

// Run the function to insert the dummy subject
insertDummySubject().catch((err) => {
	console.error("Error inserting dummy subject:", err);
});
