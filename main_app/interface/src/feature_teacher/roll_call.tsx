import { useEffect, useState } from "react";
import api from "../apis";
import "bootstrap/dist/css/bootstrap.min.css";

type Subject = {
  course_id: string;
  semester: string;
  subject_id: number;
  subject_name: string;
};

type Student = {
  student_id: string;
  name: string;
};

type AttendanceLocal = Record<string, { present: boolean; reason?: string }>;

export default function AttendanceComponent() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  const [students, setStudents] = useState<Student[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");

  const [attendance, setAttendance] = useState<AttendanceLocal>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================== HELPERS ================== */
  function getTeacherId(): string | null {
    try {
      return (
        JSON.parse(localStorage.getItem("info") || "{}")?.school_id ?? null
      );
    } catch {
      return null;
    }
  }

  /* ================== FETCH SUBJECTS ================== */
  useEffect(() => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      setError("Không tìm thấy teacher_id");
      return;
    }

    setLoading(true);
    api
      .post("/get_subject2/teacher", [teacherId])
      .then((res) => {
        setSubjects(res.data || []);
        if (res.data?.length) {
          setSelectedCourse(res.data[0].course_id);
        }
      })
      .catch(() => setError("Không tải được danh sách môn học"))
      .finally(() => setLoading(false));
  }, []);

  /* ================== FETCH STUDENTS + DAYS ================== */
  useEffect(() => {
    if (!selectedCourse) return;

    setLoading(true);
    Promise.all([
      api.post("/get_students_of_course", [selectedCourse]),
      api.post("/get_class_day", [selectedCourse]),
    ])
      .then(([stuRes, dayRes]) => {
        setStudents(stuRes.data || []);
        setDays(dayRes.data || []);
        setSelectedDay(dayRes.data?.[0] ?? "");
        setAttendance({});
      })
      .catch(() => setError("Không tải được dữ liệu lớp học"))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  /* ================== FETCH ABSENT ================== */
  useEffect(() => {
    if (!selectedCourse || !selectedDay || students.length === 0) return;

    api
      .post("/get_absent_student", [selectedCourse, selectedDay])
      .then((res) => {
        const absent: string[] = res.data || [];
        const map: AttendanceLocal = {};
        students.forEach((s) => {
          map[s.student_id] = { present: !absent.includes(s.student_id) };
        });
        setAttendance(map);
      })
      .catch(() => {
        const map: AttendanceLocal = {};
        students.forEach((s) => (map[s.student_id] = { present: true }));
        setAttendance(map);
      });
  }, [selectedDay, students, selectedCourse]);

  /* ================== ACTIONS ================== */
  function togglePresent(id: string) {
    setAttendance((prev) => ({
      ...prev,
      [id]: { ...prev[id], present: !prev[id]?.present },
    }));
  }

  function setReason(id: string, reason: string) {
    setAttendance((prev) => ({
      ...prev,
      [id]: { ...prev[id], reason },
    }));
  }

  async function saveAttendance() {
    if (!selectedCourse || !selectedDay) return;

    setSaving(true);

    const present: string[] = [];
    const absent: string[] = [];

    Object.entries(attendance).forEach(([id, rec]) => {
      rec.present ? present.push(id) : absent.push(id);
    });

    const payload = {
      [selectedCourse]: {
        [selectedDay]: { "1": present, "0": absent },
      },
    };

    try {
      await api.post("/roll_call", payload);
      alert("✅ Lưu điểm danh thành công");
    } catch {
      alert("❌ Lưu điểm danh thất bại");
    } finally {
      setSaving(false);
    }
  }

  /* ================== UI ================== */
  return (
    <div className="container mt-4">
      <h3 className="mb-4">📋 Điểm danh</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Môn học</label>
          <select
            className="form-select"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.course_id} value={s.course_id}>
                {s.subject_name} ({s.course_id})
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Buổi học</label>
          <select
            className="form-select"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4 d-flex align-items-end">
          <button
            className="btn btn-primary w-100"
            disabled={saving}
            onClick={saveAttendance}
          >
            {saving ? "Đang lưu..." : "💾 Lưu điểm danh"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <table className="table table-bordered table-striped mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>MSSV</th>
                <th>Họ tên</th>
                <th>Có mặt</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, idx) => {
                const rec = attendance[st.student_id] ?? { present: true };
                return (
                  <tr
                    key={st.student_id}
                    className={!rec.present ? "table-danger" : ""}
                  >
                    <td>{idx + 1}</td>
                    <td>{st.student_id}</td>
                    <td>{st.name}</td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={rec.present}
                        onChange={() => togglePresent(st.student_id)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={rec.reason ?? ""}
                        onChange={(e) =>
                          setReason(st.student_id, e.target.value)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-3">
                    Không có sinh viên
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
