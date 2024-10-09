import axios from "axios";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";

function StatsSection({ s, t }: { s: number | null; t: number | null }) {
  return (
    <div className="h-full gap-5 flex flex-col">
      <div className="flex flex-row items-end justify-start gap-5 from-amber-500 via-amber-800 to-amber-400 text-white text-5xl rounded-2xl p-10 bg-gradient-to-br">
        <div className="text-9xl font-bold">{t}</div> Active Teachers
      </div>
      <div className="flex flex-row items-end justify-start gap-5 from-amber-500 via-amber-800 to-amber-400 text-white text-5xl rounded-2xl p-10 bg-gradient-to-br">
        <div className="text-9xl font-bold">{s}</div> Students Enrolled
      </div>
    </div>
  );
}

type StudentObj = {
  USN: string;
  Email: string;
  Name: string;
  Branch: string;
  Section: string;
  Batch: number;
};

function StudentsSection({ dataList }: { dataList: StudentObj[] }) {
  return (
    <div className="flex flex-col">
      <div className="w-full flex flex-row gap-1 rounded-t-xl overflow-hidden bg-gradient-to-tr from-amber-500 via-amber-800 to-amber-400 text-white font-semibold text-xl">
        <div className="w-[15%] text-center py-3 border-r-4 border-white">
          USN
        </div>
        <div className="w-[30%] text-center py-3 border-r-4 border-white">
          Email
        </div>
        <div className="w-[25%] text-center py-3 border-r-4 border-white">
          Name
        </div>
        <div className="w-[10%] text-center py-3 border-r-4 border-white">
          Branch
        </div>
        <div className="w-[10%] text-center py-3 border-r-4 border-white">
          Section
        </div>
        <div className="w-[10%] text-center py-3">Batch</div>
      </div>
      <div className="flex flex-col w-full overflow-y-scroll flex-1">
        {dataList.map((data) => (
          <div className="w-full flex flex-row group">
            <div className="w-[15%] py-3 px-2 group-hover:font-bold">
              {data.USN}
            </div>
            <div className="w-[30%] py-3 px-2 group-hover:font-bold">
              {data.Email}
            </div>
            <div className="w-[25%] py-3 px-2 group-hover:font-bold">
              {data.Name}
            </div>
            <div className="w-[10%] py-3 px-2 group-hover:font-bold">
              {data.Branch}
            </div>
            <div className="w-[10%] py-3 px-2 group-hover:font-bold">
              {data.Section}
            </div>
            <div className="w-[10%] py-3 px-2 group-hover:font-bold">
              {data.Batch}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type TeacherObj = {
  TID: string;
  Email: string;
  Name: string;
};

function TeachersSection({ dataList }: { dataList: TeacherObj[] }) {
  return (
    <div className="flex flex-col">
      <div className="w-full flex flex-row gap-1 rounded-t-xl overflow-hidden bg-gradient-to-tr from-amber-500 via-amber-800 to-amber-400 text-white font-semibold text-xl">
        <div className="flex-1 text-center py-3 border-r-4 border-white">
          TID
        </div>
        <div className="flex-1 text-center py-3 border-r-4 border-white">
          Email
        </div>
        <div className="flex-1 text-center py-3">Name</div>
      </div>
      <div className="flex flex-col w-full overflow-y-scroll flex-1">
        {dataList.map((data) => (
          <div className="w-full flex flex-row group">
            <div className="flex-1 py-3 px-2 group-hover:font-bold">
              {data.TID}
            </div>
            <div className="flex-1 py-3 px-2 group-hover:font-bold">
              {data.Email}
            </div>
            <div className="flex-1 py-3 px-2 group-hover:font-bold">
              {data.Name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type SectionEnum =
  | "statistics"
  | "students"
  | "teachers"
  | "+ student"
  | "+ teacher";

const Sections: SectionEnum[] = [
  "statistics",
  "students",
  "teachers",
  "+ student",
  "+ teacher",
];

function AddStudent({ refresh }: { refresh: () => void }) {
  const [usn, setUsn] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [batch, setBatch] = useState(2024);

  const addStudent = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        "http://localhost:5000/students",
        { usn, email, name, branch, section, batch },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Student added successfully");
      refresh();
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  return (
    <div className="h-full gap-5 flex flex-col">
      <input
        type="text"
        placeholder="USN"
        value={usn}
        onChange={(e) => setUsn(e.target.value)}
        className="p-3 border rounded border-blue-800"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="p-3 border rounded border-blue-800"
      />
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="p-3 border rounded border-blue-800"
      />
      <input
        type="text"
        placeholder="Branch"
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
        className="p-3 border rounded border-blue-800"
      />
      <input
        type="text"
        placeholder="Section"
        value={section}
        onChange={(e) => setSection(e.target.value)}
        className="p-3 border rounded border-blue-800"
      />
      <input
        type="number"
        placeholder="Batch"
        value={batch}
        onChange={(e) => setBatch(parseInt(e.target.value))}
        className="p-3 border rounded border-blue-800"
      />
      <button
        onClick={addStudent}
        className="p-3 bg-blue-500 text-white rounded"
      >
        Add Student
      </button>
    </div>
  );
}

function AddTeacher({ refresh }: { refresh: () => void }) {
  const [tid, setTid] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const isDisabled = useMemo(
    () => tid.length >= 5 && email.length >= 7 && name.length >= 3,
    [tid, email, name]
  );

  console.log("isDisabled::", isDisabled);

  const addTeacher = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        "http://localhost:5000/teachers",
        { tid, email, name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Teacher added successfully");
      refresh();
    } catch (error) {
      console.error("Error adding teacher:", error);
    }
  };

  return (
    <div className="h-full gap-5 flex flex-col">
      <input
        type="text"
        placeholder="TID (Min 5 characters)"
        value={tid}
        onChange={(e) => setTid(e.target.value)}
        className="p-3 border rounded border-blue-800"
        minLength={5}
      />
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="p-3 border rounded border-blue-800"
        minLength={3}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="p-3 border rounded border-blue-800"
      />
      <button
        disabled={isDisabled}
        onClick={isDisabled ? () => null : addTeacher}
        className={clsx(
          "p-3 bg-blue-500 text-white rounded",
          isDisabled && "bg-blue-200"
        )}
      >
        Add Teacher
      </button>
    </div>
  );
}

export default function AdminPanel() {
  const [section, setSection] = useState<SectionEnum>("statistics");
  const [teachersCount, setTeachersCount] = useState<number | null>(null);
  const [studentsCount, setStudentsCount] = useState<number | null>(null);
  const [teachersList, setTeachersList] = useState<TeacherObj[] | null>(null);
  const [studentsList, setStudentsList] = useState<StudentObj[] | null>(null);

  const refreshData = useCallback(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No token found in localStorage");
      return;
    }

    const fetchData = async () => {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        const [
          teachersCountResponse,
          studentsCountResponse,
          teachersListResponse,
          studentsListResponse,
        ] = await Promise.all([
          axios.get("http://localhost:5000/teachers/count", config),
          axios.get("http://localhost:5000/students/count", config),
          axios.get("http://localhost:5000/teachers", config),
          axios.get("http://localhost:5000/students", config),
        ]);

        setTeachersCount(teachersCountResponse.data.count);
        setStudentsCount(studentsCountResponse.data.count);
        setTeachersList(teachersListResponse.data);
        setStudentsList(studentsListResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => refreshData(), [refreshData]);

  return (
    <div className="w-full flex-1 flex flex-row gap-7">
      <div className="w-[25%] bg-white rounded-3xl p-5 flex flex-col gap-5">
        {Sections.map((k) => (
          <div
            key={k}
            onClick={() => setSection(k as SectionEnum)}
            className={clsx(
              "text-white bg-amber-900 hover:bg-amber-500 hover:scale-[1.07] font-bold rounded-xl p-4 text-2xl",
              section === k && "bg-amber-300 text-amber-800"
            )}
          >
            {k.toUpperCase()}
          </div>
        ))}
      </div>
      <div className="flex-1 bg-white rounded-3xl p-5">
        {section === "statistics" && (
          <StatsSection t={teachersCount} s={studentsCount} />
        )}
        {section === "students" && studentsList && (
          <StudentsSection dataList={studentsList} />
        )}
        {section === "teachers" && teachersList && (
          <TeachersSection dataList={teachersList} />
        )}
        {section === "+ student" && <AddStudent refresh={refreshData} />}
        {section === "+ teacher" && <AddTeacher refresh={refreshData} />}
      </div>
    </div>
  );
}
