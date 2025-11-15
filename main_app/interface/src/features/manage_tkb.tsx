import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

interface PersonInfo {
  address: string;
  date_of_joining: string;
  email: string;
  name: string;
  personal_id: string;
  phone_number: string;
  school_id: string;
  class_name?: string;
}

interface Schedule {
  [date: string]: Array<{ [subject: string]: number[] }>;
}

interface StudentResult {
  [subject: string]: {
    scores: (number | null)[];
    scores_name: string[];
  };
}

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

export default function LookupPage() {
  const [mode, setMode] = useState<"student" | "teacher">("student");
  const [list, setList] = useState<Record<string, PersonInfo>>({});
  const [selected, setSelected] = useState<string>("");
  const [info, setInfo] = useState<PersonInfo | null>(null);
  const [schedule, setSchedule] = useState<Schedule>({});

  // week control
  const [weekOffset, setWeekOffset] = useState(0);

  // new states for subjects and results
  const [subjects, setSubjects] = useState<string[]>([]);
  const [results, setResults] = useState<StudentResult>({});

  const fetchList = async () => {
    try {
      const url =
        mode === "teacher"
          ? "http://127.0.0.1:5000/api/v1/get_teachers"
          : "http://127.0.0.1:5000/api/v1/get_students";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setList(data || {});
    } catch (err) {
      console.error("fetchList error", err);
      setList({});
    }
  };

  const fetchInfo = async (id: string) => {
    if (!id) return;
    const selectedInfo = list[id] || null;
    setInfo(selectedInfo);
    setSubjects([]);
    setResults({});

    try {
      const url =
        mode === "teacher"
          ? "http://127.0.0.1:5000/api/v1/get_tkb/teacher"
          : "http://127.0.0.1:5000/api/v1/get_tkb/student";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setSchedule(data || {});
    } catch (err) {
      console.error("fetchInfo schedule error", err);
      setSchedule({});
    }

    // fetch subjects and results
    try {
      const subjUrl =
        mode === "teacher"
          ? "http://127.0.0.1:5000/api/v1/get_subject_of/teacher"
          : "http://127.0.0.1:5000/api/v1/get_subject_of/student";
      const subjRes = await fetch(subjUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([id]),
      });
      const subjData: string[] = await subjRes.json();
      setSubjects(subjData || []);

      if (mode === "student") {
        const resUrl = "http://127.0.0.1:5000/api/v1/get_result/student";
        const resRes = await fetch(resUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([id]),
        });
        const resData: StudentResult = await resRes.json();
        setResults(resData || {});
      }
    } catch (err) {
      console.error("fetch subjects/results error", err);
      setSubjects([]);
      setResults({});
    }
  };

  useEffect(() => {
    setSelected("");
    setInfo(null);
    setSchedule({});
    setSubjects([]);
    setResults({});
    setWeekOffset(0);
    fetchList();
  }, [mode]);

  // compute monday of current week + weekOffset
  const getWeekStart = (): Date => {
    const now = new Date();
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekEnd = (start: Date): Date => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const renderTimetable = () => {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd(weekStart);

    const timetable: { [day: string]: { [period: number]: string[] } } = {};
    DAYS.forEach((d) => {
      timetable[d] = {};
    });

    Object.entries(schedule).forEach(([dateStr, subjects]) => {
      const date = new Date(dateStr + "T00:00:00");
      if (Number.isNaN(date.getTime())) return;
      if (date < weekStart || date > weekEnd) return;

      const weekday = date.getDay();
      const vnIndex = weekday === 0 ? 6 : weekday - 1;
      const dayName = DAYS[vnIndex];

      subjects.forEach((subjObj) => {
        Object.entries(subjObj).forEach(([subject, periods]) => {
          periods.forEach((p) => {
            if (!timetable[dayName][p]) timetable[dayName][p] = [];
            if (!timetable[dayName][p].includes(subject))
              timetable[dayName][p].push(subject);
          });
        });
      });
    });

    const maxPeriods = 10;

    return (
      <div>
        <div className="d-flex justify-content-between mb-2 align-items-center">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            ◀ Tuần trước
          </button>
          <div>
            <strong>
              Tuần {weekStart.toLocaleDateString()} -{" "}
              {getWeekEnd(weekStart).toLocaleDateString()}
            </strong>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            Tuần sau ▶
          </button>
        </div>

        <table className="table table-bordered mt-3 text-center">
          <thead>
            <tr>
              <th>Tiết</th>
              {DAYS.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxPeriods }, (_, i) => i + 1).map(
              (period) => (
                <tr key={period}>
                  <td>
                    <strong>{period}</strong>
                  </td>
                  {DAYS.map((day) => (
                    <td key={day + period} style={{ verticalAlign: "middle" }}>
                      {(timetable[day][period] || []).map((subj, idx) => (
                        <div key={idx}>{subj}</div>
                      ))}
                    </td>
                  ))}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubjectsAndResults = () => {
    if (!selected) return null;

    if (mode === "teacher") {
      // bảng chỉ liệt kê tên môn
      return (
        <div className="card p-3 mt-4">
          <h5>Môn giảng dạy</h5>
          <table className="table table-bordered text-center">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên môn</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subj, idx) => (
                <tr key={subj}>
                  <td>{idx + 1}</td>
                  <td>{subj}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      // student: hiển thị bảng kết quả
      if (subjects.length === 0) return null;

      // lấy danh sách cột từ môn đầu tiên
      const firstSubj = subjects[0];
      const scoreColumns = results[firstSubj]?.scores_name || [];

      return (
        <div className="card p-3 mt-4">
          <h5>Kết quả học tập</h5>
          <table className="table table-bordered text-center">
            <thead>
              <tr>
                <th>Môn học</th>
                {scoreColumns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map((subj) => (
                <tr key={subj}>
                  <td>{subj}</td>
                  {scoreColumns.map((col, idx) => (
                    <td key={idx}>{results[subj]?.scores[idx] ?? "Chưa có"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Tra cứu thông tin</h3>

      <div className="mb-3">
        <button
          className={`btn me-2 ${
            mode === "student" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setMode("student")}
        >
          Sinh viên
        </button>
        <button
          className={`btn ${
            mode === "teacher" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setMode("teacher")}
        >
          Giảng viên
        </button>
      </div>

      <div className="mb-3">
        <label className="form-label">
          Chọn {mode === "teacher" ? "giảng viên" : "sinh viên"}
        </label>
        <select
          className="form-select"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            fetchInfo(e.target.value);
          }}
        >
          <option value="">-- Chọn --</option>
          {Object.keys(list).map((id) => (
            <option key={id} value={id}>
              {id} - {list[id].name}
            </option>
          ))}
        </select>
      </div>

      {info && (
        <div className="card p-3 mb-4">
          <h5>Thông tin cá nhân</h5>
          <p>Họ tên: {info.name}</p>
          <p>Mã: {info.school_id}</p>
          <p>Email: {info.email}</p>
          <p>Địa chỉ: {info.address}</p>
          <p>Ngày vào trường: {info.date_of_joining}</p>
          {info.class_name && <p>Lớp: {info.class_name}</p>}
        </div>
      )}

      {Object.keys(schedule).length > 0 && (
        <div>
          <h5>{mode === "teacher" ? "Lịch giảng dạy" : "Lịch học"}</h5>
          {renderTimetable()}
        </div>
      )}

      {renderSubjectsAndResults()}
    </div>
  );
}
