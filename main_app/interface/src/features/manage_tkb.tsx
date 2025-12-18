import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

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
  const [search, setSearch] = useState("");

  const fetchList = async () => {
    try {
      const endpoint = mode === "teacher" ? "/get_teachers" : "/get_students";

      const res = await api.post(endpoint, {});
      setList(res.data || {});
    } catch (err) {
      console.error("fetchList error", err);
      setList({});
    }
  };

  const filteredList = Object.fromEntries(
    Object.entries(list).filter(([id, info]) =>
      id.toLowerCase().includes(search.toLowerCase())
    )
  );

  const searchById = () => {
    if (!search) return;
    if (!list[search]) {
      alert("Không tìm thấy mã trong danh sách đã tải!");
      return;
    }
    setSelected(search);
    fetchInfo(search);
  };

  const fetchInfo = async (id: string) => {
    if (!id) return;

    const selectedInfo = list[id] || null;
    setInfo(selectedInfo);
    setSubjects([]);
    setResults({});

    // ===== LẤY TKB =====
    try {
      const endpoint =
        mode === "teacher" ? "/get_tkb/teacher" : "/get_tkb/student";

      const res = await api.post(endpoint, { id });
      setSchedule(res.data || {});
    } catch (err) {
      console.error("fetchInfo schedule error", err);
      setSchedule({});
    }

    // ===== LẤY MÔN + KẾT QUẢ =====
    try {
      const subjectEndpoint =
        mode === "teacher"
          ? "/get_subject_of/teacher"
          : "/get_subject_of/student";

      const subjRes = await api.post(subjectEndpoint, [id]);
      setSubjects(subjRes.data || []);

      if (mode === "student") {
        const resRes = await api.post("/get_result/student", [id]);
        setResults(resRes.data || {});
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

    const maxPeriods = 20;

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
                <tr key={`${subj}-${idx}`}>
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
              {subjects.map((subj, subjIdx) => (
                <tr key={`${subj}-${subjIdx}`}>
                  <td>{subj}</td>
                  {scoreColumns.map((col, idx) => (
                    <td key={`${subj}-${idx}`}>
                      {results[subj]?.scores[idx] ?? "Chưa có"}
                    </td>
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

        {/* Ô tìm kiếm */}
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Tìm theo mã (VD: 2020SV13)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Nút tìm theo mã */}
        <button className="btn btn-success w-100 mb-3" onClick={searchById}>
          Tìm theo mã
        </button>

        {/* Dropdown danh sách */}
        <select
          className="form-select"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            fetchInfo(e.target.value);
          }}
        >
          <option value="">-- Chọn --</option>

          {Object.keys(filteredList).map((id) => (
            <option key={id} value={id}>
              {id} - {filteredList[id].name}
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
