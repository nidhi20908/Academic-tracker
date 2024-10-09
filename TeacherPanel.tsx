import axios from "axios";
import clsx from "clsx";
import { useEffect, useState } from "react";

type SubjectInfo = {
  SID: string;
  SName: string;
  Branch: string;
  Batch: number;
  Section: string;
};

type StudentObj = {
  USN: string;
  Name: string;
};

function TeacherPanel() {
  const [tid, setTid] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectInfo[] | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(
    null
  );
  const [students, setStudents] = useState<StudentObj[] | null>(null);
  const [view, setView] = useState<"attendance" | "marks">("attendance");

  useEffect(() => {
    const fetchTid = async () => {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      try {
        const response = await axios.get(
          "http://localhost:5000/teacher/tid",
          config
        );
        setTid(response.data.TID);
      } catch (error) {
        console.error("Error fetching TID:", error);
      }
    };

    fetchTid();
  }, []);

  useEffect(() => {
    if (!tid) return;

    const fetchSubjects = async () => {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      try {
        const response = await axios.get(
          `http://localhost:5000/teacher/subjects/${tid}`,
          config
        );
        setSubjects(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, [tid]);

  const fetchStudents = async (subject: SubjectInfo) => {
    const token = localStorage.getItem("token");
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      const response = await axios.get(
        `http://localhost:5000/students?branch=${subject.Branch}&section=${subject.Section}&batch=${subject.Batch}`,
        config
      );
      setStudents(response.data);
      setSelectedSubject(subject);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-row gap-7">
      <div className="w-[25%] bg-white rounded-3xl p-5 flex flex-col gap-5">
        {subjects === null ? (
          <div className="text-blue-700 font-semibold">Loading...</div>
        ) : (
          subjects.map((subject) => (
            <div
              key={subject.SID}
              onClick={() => fetchStudents(subject)}
              className={clsx(
                "text-white bg-amber-900 hover:bg-amber-500 hover:scale-[1.07] font-bold rounded-xl p-4 text-2xl",
                selectedSubject?.SID === subject.SID && "bg-amber-700"
              )}
            >
              {`${subject.SName} - ${subject.Branch} ${subject.Section} ${subject.Batch}`}
            </div>
          ))
        )}
      </div>
      <div className="flex-1 bg-white rounded-3xl p-5">
        {selectedSubject && (
          <div>
            <div className="flex justify-between">
              <button
                className={clsx(
                  "text-white bg-amber-900 hover:bg-amber-500 font-bold rounded-xl p-4",
                  view === "attendance" && "bg-amber-700"
                )}
                onClick={() => setView("attendance")}
              >
                Attendance
              </button>
              <button
                className={clsx(
                  "text-white bg-amber-900 hover:bg-amber-500 font-bold rounded-xl p-4",
                  view === "marks" && "bg-amber-700"
                )}
                onClick={() => setView("marks")}
              >
                Marks
              </button>
            </div>
            {view === "attendance" && (
              <AttendanceSection
                subject={selectedSubject}
                students={students}
              />
            )}
            {view === "marks" && (
              <MarksSection subject={selectedSubject} students={students} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceSection({
  subject,
  students,
}: {
  subject: SubjectInfo;
  students: StudentObj[] | null;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceData, setAttendanceData] = useState<{
    [usn: string]: boolean;
  }>({});

  const handleAttendanceChange = (usn: string, present: boolean) => {
    setAttendanceData((prevData) => ({
      ...prevData,
      [usn]: present,
    }));
  };

  useEffect(() => {
    const fetchInitialAttendance = async () => {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      try {
        const response = await axios.get(
          `http://localhost:5000/teacher/attendance/${subject.SID}/${date}`,
          config
        );

        const initialAttendanceData = {};
        response.data.forEach((record: any) => {
          // @ts-ignore
          initialAttendanceData[record.USN] = record.Status === 1; // Assuming Status 1 represents Present
        });

        setAttendanceData(initialAttendanceData);
      } catch (error) {
        console.error("Error fetching initial attendance:", error);
      }
    };

    if (students && date) {
      fetchInitialAttendance();
    }
  }, [students, date, subject.SID]);

  const handleAttendanceSubmit = async () => {
    const token = localStorage.getItem("token");
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      const attendanceRecords = Object.keys(attendanceData).map((usn) => ({
        Date: date,
        USN: usn,
        SID: subject.SID,
        Status: attendanceData[usn],
      }));

      await axios.post(
        "http://localhost:5000/teacher/attendance",
        attendanceRecords,
        config
      );
      console.log("Attendance submitted successfully.");
    } catch (error) {
      console.error("Error submitting attendance:", error);
    }
  };

  return (
    <div>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-blue-700 text-white p-2 my-2 rounded-2xl"
      />

      {students ? (
        <div className="overflow-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 bg-gradient-to-tr from-amber-400 via-amber-900 to-amber-700 rounded-lg border-r-8 font-bold border-white text-left text-lg text-white uppercase tracking-wider"
                >
                  USN
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 bg-gradient-to-tr from-amber-400 via-amber-900 to-amber-700 rounded-lg border-r-8 font-bold border-white text-left text-lg text-white uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 bg-gradient-to-tr from-amber-400 via-amber-900 to-amber-700 rounded-lg border-r-8 font-bold border-white text-left text-lg text-white uppercase tracking-wider"
                >
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.USN}>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-black font-medium">
                    {student.USN}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                    {student.Name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                    <input
                      type="radio"
                      id={`${student.USN}-present`}
                      name={student.USN}
                      checked={attendanceData[student.USN] === true}
                      onChange={() => handleAttendanceChange(student.USN, true)}
                    />
                    <label
                      htmlFor={`${student.USN}-present`}
                      className="ml-2 mr-4"
                    >
                      Present
                    </label>
                    <input
                      type="radio"
                      id={`${student.USN}-absent`}
                      name={student.USN}
                      checked={attendanceData[student.USN] === false}
                      onChange={() =>
                        handleAttendanceChange(student.USN, false)
                      }
                    />
                    <label htmlFor={`${student.USN}-absent`} className="ml-2">
                      Absent
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Loading...</p>
      )}

      <button
        onClick={handleAttendanceSubmit}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Submit Attendance
      </button>
    </div>
  );
}

function MarksSection({
  subject,
  students,
}: {
  subject: SubjectInfo;
  students: StudentObj[] | null;
}) {
  const [examType, setExamType] = useState("");
  const [maxMarks, setMaxMarks] = useState<number | null>(null);
  const [marksData, setMarksData] = useState<{
    [usn: string]: {
      Marks: number;
    };
  }>({});

  useEffect(() => {
    const fetchMarksData = async () => {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      try {
        const maxMarksResponse = await axios.get(
          `http://localhost:5000/teacher/marks/${subject.SID}/${examType}/maxmarks`,
          config
        );
        setMaxMarks(maxMarksResponse.data.MaxMarks);

        // Fetch initial marks data for the selected exam type
        const initialMarksResponse = await axios.get(
          `http://localhost:5000/teacher/marks/${subject.SID}/${examType}/initial`,
          config
        );
        const initialMarksData = {};
        // @ts-ignore
        initialMarksResponse.data.forEach((record) => {
          // @ts-ignore
          initialMarksData[record.USN] = {
            Marks: record.Marks,
          };
        });
        setMarksData(initialMarksData);
      } catch (error) {
        console.error("Error fetching marks data:", error);
      }
    };

    if (examType && students) {
      fetchMarksData();
    }
  }, [examType, students, subject.SID]);

  const handleMarksChange = (usn: string, marks: number) => {
    setMarksData((prevData) => ({
      ...prevData,
      [usn]: {
        Marks: marks,
      },
    }));
  };

  const handleMarksSubmit = async () => {
    const token = localStorage.getItem("token");
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      const marksRecords = Object.keys(marksData).map((usn) => ({
        USN: usn,
        SID: subject.SID,
        Type: examType,
        Marks: marksData[usn].Marks,
        MaxMarks: maxMarks,
      }));

      await axios.post(
        "http://localhost:5000/teacher/marks",
        marksRecords,
        config
      );
      console.log("Marks submitted successfully.");
    } catch (error) {
      console.error("Error submitting marks:", error);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-4 gap-4 my-3">
        <label htmlFor="examType" className="mr-2">
          Exam Type:
        </label>
        <select
          id="examType"
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md bg-blue-700 text-white"
        >
          <option value="">Select Exam Type</option>
          <option value="I1">Internal 1</option>
          <option value="I2">Internal 2</option>
          <option value="I3">Internal 3</option>
          <option value="E">External</option>
        </select>

        <div className="flex items-center">
          <label htmlFor="maxMarks" className="mr-2">
            Max Marks:
          </label>
          <input
            id="maxMarks"
            type="number"
            value={maxMarks !== null ? maxMarks : ""}
            onChange={(e) => setMaxMarks(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md"
            min="0"
          />
        </div>
      </div>

      {students ? (
        <div className="overflow-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 bg-gradient-to-tr from-amber-400 via-amber-900 to-amber-700 rounded-lg border-r-8 font-bold border-white text-left text-lg text-white uppercase tracking-wider"
                >
                  USN
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 bg-gradient-to-tr from-amber-400 via-amber-900 to-amber-700 rounded-lg border-r-8 font-bold border-white text-left text-lg text-white uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 bg-gradient-to-tr from-amber-400 via-amber-900 to-amber-700 rounded-lg border-r-8 font-bold border-white text-left text-lg text-white uppercase tracking-wider"
                >
                  Marks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.USN}>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-black font-medium">
                    {student.USN}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                    {student.Name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                    <input
                      type="number"
                      value={marksData[student.USN]?.Marks || ""}
                      onChange={(e) =>
                        handleMarksChange(student.USN, parseInt(e.target.value))
                      }
                      className="w-20"
                      max={maxMarks ?? 0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Loading...</p>
      )}

      <button
        onClick={handleMarksSubmit}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={!maxMarks}
      >
        Submit Marks
      </button>
    </div>
  );
}

export default TeacherPanel;
