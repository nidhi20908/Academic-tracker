import React, { useState, useEffect } from "react";
import axios from "axios";
import clsx from "clsx";

type SubjectInfo = {
  SID: string;
  SName: string;
};

type AttendanceInfo = {
  Status: string;
  Date: string;
};

const AttendanceSection = ({ subject }: { subject: SubjectInfo }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [attendance, setAttendance] = useState<AttendanceInfo[]>([]);
  const [overallAttendance, setOverallAttendance] = useState<AttendanceInfo[]>(
    []
  );
  const [attendanceSummary, setAttendanceSummary] = useState({
    monthAttended: 0,
    monthTotal: 0,
    overallAttended: 0,
    overallTotal: 0,
    percentage: "0",
  });

  useEffect(() => {
    const fetchAttendance = async () => {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      try {
        const response = await axios.get(
          `http://localhost:5000/student/attendance?SID=${subject.SID}&year=${year}&month=${month}`,
          config
        );
        setAttendance(response.data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };

    const fetchOverallAttendance = async () => {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      try {
        const response = await axios.get(
          `http://localhost:5000/student/overall-attendance?SID=${subject.SID}`,
          config
        );
        setOverallAttendance(response.data);
      } catch (error) {
        console.error("Error fetching overall attendance:", error);
      }
    };

    fetchAttendance();
    fetchOverallAttendance();
  }, [subject, year, month]);

  useEffect(() => {
    const updateAttendanceSummary = () => {
      const monthAttended = attendance.filter((a) => a.Status).length;
      const monthTotal = attendance.length;
      const overallAttended = overallAttendance.filter((a) => a.Status).length;
      const overallTotal = overallAttendance.length;
      const percentage = (
        overallTotal > 0
          ? ((overallAttended / overallTotal) * 100).toFixed(2)
          : 0
      ).toString();

      setAttendanceSummary({
        monthAttended,
        monthTotal,
        overallAttended,
        overallTotal,
        percentage,
      });
    };

    updateAttendanceSummary();
  }, [attendance, overallAttendance]);

  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div>
      <div className="py-5 flex flex-row gap-3 items-center">
        <label className="mr-2">Year:</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="p-2 bg-blue-700 text-white rounded-lg"
        >
          <option value="2029">2029</option>
          <option value="2028">2028</option>
          <option value="2027">2027</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
          <option value="2020">2020</option>
          <option value="2019">2019</option>
          <option value="2018">2018</option>
          <option value="2017">2017</option>
        </select>
        <label className="ml-4 mr-2">Month:</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="p-2 bg-blue-700 text-white rounded-lg"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const attendanceRecord = attendance.find(
            (a) => new Date(a.Date).getDate() === day
          );
          const statusColor = attendanceRecord
            ? attendanceRecord.Status
              ? "bg-green-700"
              : "bg-red-700"
            : "bg-gray-700";

          return (
            <div
              key={day}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${statusColor}`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col p-5 gap-5 text-white font-semibold bg-gradient-to-bl from-amber-500 via-amber-950 to-amber-700 w-fit rounded-3xl">
        <p>
          Classes attended this month: {attendanceSummary.monthAttended} out of{" "}
          {attendanceSummary.monthTotal}
        </p>
        <p>
          Overall attendance for {subject.SName}:{" "}
          {attendanceSummary.overallAttended} out of{" "}
          {attendanceSummary.overallTotal} ({attendanceSummary.percentage}%)
        </p>
      </div>
      <div className="mt-4 flex flex-col p-5 gap-5 text-amber-900 font-semibold bg-gradient-to-bl from-amber-100 via-amber-300 to-amber-200 w-fit rounded-3xl">
        Green represents Presence, Red represents Absence and Gray represents no
        class.
      </div>
    </div>
  );
};

interface MarkRecord {
  Type: string;
  Marks: number;
  MaxMarks: number;
}

const fixExamType = (s: string) => {
  if (s === "I1") {
    return "Internal 1";
  } else if (s === "I2") {
    return "Internal 2";
  } else if (s === "I3") {
    return "Internal 3";
  } else {
    return "External";
  }
};

const MarksSection = ({ subject }: { subject: SubjectInfo }) => {
  const [marks, setMarks] = useState<MarkRecord[]>([]);

  useEffect(() => {
    const fetchMarks = async () => {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      try {
        const response = await axios.get(
          `http://localhost:5000/student/marks?SID=${subject.SID}`,
          config
        );
        setMarks(response.data);
      } catch (error) {
        console.error("Error fetching marks:", error);
      }
    };

    fetchMarks();
  }, [subject]);

  return (
    <div className="flex flex-col gap-5 mt-5">
      <h2 className="text-2xl font-bold">{subject.SName} - Marks</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 bg-gradient-to-tr from-amber-400 via-amber-900 to-amber-700 rounded-lg border-r-8 font-bold border-white text-left text-lg text-white uppercase tracking-wider"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 bg-gradient-to-tr from-amber-400 via-amber-900 to-amber-700 rounded-lg border-r-8 font-bold border-white text-left text-lg text-white uppercase tracking-wider"
            >
              Marks
            </th>
            <th
              scope="col"
              className="px-6 py-3 bg-gradient-to-tr from-amber-400 via-amber-900 to-amber-700 rounded-lg border-r-8 font-bold border-white text-left text-lg text-white uppercase tracking-wider"
            >
              Max Marks
            </th>
            <th
              scope="col"
              className="px-6 py-3 bg-gradient-to-tr from-amber-400 via-amber-900 to-amber-700 rounded-lg border-r-8 font-bold border-white text-left text-lg text-white uppercase tracking-wider"
            >
              Percentage
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {marks.map((mark, index) => {
            const percentage = ((mark.Marks / mark.MaxMarks) * 100).toFixed(2);

            return (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                  {fixExamType(mark.Type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                  {mark.Marks}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                  {mark.MaxMarks}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                  {percentage} %
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const StudentPanel = () => {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(
    null
  );
  const [view, setView] = useState("attendance");

  useEffect(() => {
    const fetchSubjects = async () => {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      try {
        const response = await axios.get(
          "http://localhost:5000/student/subjects",
          config
        );
        setSubjects(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <div className="flex flex-1 w-full flex-row gap-7">
      <div className="w-1/4 bg-white p-5 rounded-3xl gap-5 flex flex-col">
        {subjects.map((subject) => (
          <div
            key={subject.SID}
            className={clsx(
              "hover:bg-amber-500 hover:scale-[1.07] font-bold rounded-xl p-4 text-2xl",
              selectedSubject?.SID === subject.SID
                ? "bg-amber-400 text-amber-800"
                : "bg-amber-900 text-white"
            )}
            onClick={() => setSelectedSubject(subject)}
          >
            {subject.SName} - {subject.SID}
          </div>
        ))}
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
                  view === "attendance" && "bg-amber-700"
                )}
                onClick={() => setView("marks")}
              >
                Marks
              </button>
            </div>
            {view === "attendance" ? (
              <AttendanceSection subject={selectedSubject} />
            ) : (
              <MarksSection subject={selectedSubject} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPanel;
