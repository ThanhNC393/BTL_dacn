import { useEffect, useState } from "react";

// AttendanceComponent.tsx
// Updated to match the APIs you provided (local dev endpoints on 127.0.0.1)
// - Fetch teacher's subjects using localStorage.info.school_id
// - When a course is selected, fetch students and class days
// - Attempt to fetch existing roll_call (GET) if the backend supports it
// - Save attendance using the roll_call POST payload format you specified

type Subject = {
  course_id: string;
  semester: string;
  subject_id: number;
  subject_name: string;
};

type Student = {
  student_id: string;
  name: string;
  final_result?: number;
  scores?: number[];
  scores_name?: string[];
};

// local representation of attendance per student
type AttendanceLocal = Record<string, { present: boolean; reason?: string }>; // keyed by student_id

const api = {
  getSubjects: "http://127.0.0.1:5000/api/v1/get_subject2/teacher",
  getStudentsOfCourse: "http://127.0.0.1:5000/api/v1/get_students_of_course",
  getClassDays: "http://127.0.0.1:5000/api/v1/get_class_day",
  rollCall: "http://127.0.0.1:5000/api/v1/roll_call",
};

export default function AttendanceComponent() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [days, setDays] = useState<string[]>([]); // dates as returned "dd/mm/yyyy"
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceLocal>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // helper to read teacher id from localStorage.info.school_id
  function getTeacherId(): string | null {
    try {
      const raw = localStorage.getItem("info");
      if (!raw) return null;
      const info = JSON.parse(raw);
      return info?.school_id ?? null;
    } catch (e) {
      console.warn("Failed to read teacher id from localStorage.info", e);
      return null;
    }
  }

  // On mount: fetch subjects for this teacher
  useEffect(() => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      setError("Teacher id not found in localStorage.info.school_id");
      return;
    }
    setLoading(true);
    setError(null);

    fetch(api.getSubjects, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([teacherId]),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch subjects");
        return r.json();
      })
      .then((data: Subject[]) => {
        setSubjects(data || []);
        if (data && data.length > 0) {
          setSelectedSubject(data[0]);
        }
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  // When selectedSubject changes, fetch students and class days
  useEffect(() => {
    if (!selectedSubject) return;
    setLoading(true);
    setError(null);

    const courseIdPayload = [selectedSubject.course_id];

    const studentsReq = fetch(api.getStudentsOfCourse, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseIdPayload),
    }).then((r) => {
      if (!r.ok) throw new Error("Failed to fetch students");
      return r.json();
    });

    const daysReq = fetch(api.getClassDays, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseIdPayload),
    }).then((r) => {
      if (!r.ok) throw new Error("Failed to fetch class days");
      return r.json();
    });

    Promise.all([studentsReq, daysReq])
      .then(([studentsData, daysData]) => {
        setStudents(studentsData || []);
        setDays(daysData || []);
        setAttendance({}); // clear local attendance when course changes
        if (daysData && daysData.length > 0) setSelectedDay(daysData[0]);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [selectedSubject]);

  // When selectedDay changes, fetch absent students for that course+day using the dedicated API get_absent_student
  useEffect(() => {
    if (!selectedSubject || !selectedDay) return;
    setLoading(true);
    setError(null);

    // The backend provides a dedicated endpoint to get absent students for a given course and date.
    // Request body: ["<course_id>", "<dd/mm/yyyy>"]
    fetch("http://127.0.0.1:5000/api/v1/get_absent_student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([selectedSubject.course_id, selectedDay]),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch absent students");
        return r.json();
      })
      .then((absentList: string[]) => {
        // Build attendance map: students in absentList => present: false, others => present: true
        const map: AttendanceLocal = {};
        students.forEach((s) => {
          map[s.student_id] = { present: !absentList.includes(s.student_id) };
        });
        setAttendance(map);
      })
      .catch((err) => {
        console.info(
          "Could not fetch absent students; defaulting to all present",
          err
        );
        const map: AttendanceLocal = {};
        students.forEach((s) => (map[s.student_id] = { present: true }));
        setAttendance(map);
      })
      .finally(() => setLoading(false));
  }, [selectedDay, selectedSubject, students]);

  function togglePresent(studentId: string) {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { present: true }),
        present: !(prev[studentId]?.present ?? true),
      },
    }));
  }

  function setReason(studentId: string, reason: string) {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { present: true }), reason },
    }));
  }

  // Save using the payload shape you specified
  async function saveAttendance() {
    if (!selectedSubject || !selectedDay) return;
    setSaving(true);
    setError(null);

    // Build present (1) and absent (0) arrays
    const present: string[] = [];
    const absent: string[] = [];
    Object.keys(attendance).forEach((sid) => {
      if (attendance[sid].present) present.push(sid);
      else absent.push(sid);
    });

    const payload: Record<string, any> = {};
    payload[selectedSubject.course_id] = {
      [selectedDay]: {
        "1": present,
        "0": absent,
      },
    };

    try {
      const res = await fetch(api.rollCall, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save roll call");
      // backend may return canonical saved structure — if it returns something useful, we could refresh
      const data = await res.json();
      console.info("Saved roll call response:", data);
      alert("Attendance saved");
    } catch (err: any) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Attendance — Instructor</h3>
        <div>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
          <button
            className="btn btn-primary"
            disabled={!selectedSubject || !selectedDay || saving}
            onClick={saveAttendance}
          >
            {saving ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden
              ></span>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-header">Your courses</div>
            <ul
              className="list-group list-group-flush"
              style={{ maxHeight: 420, overflowY: "auto" }}
            >
              {loading && subjects.length === 0 ? (
                <li className="list-group-item text-center">
                  <div className="spinner-border" role="status"></div>
                </li>
              ) : subjects.length === 0 ? (
                <li className="list-group-item">No courses found.</li>
              ) : (
                subjects.map((s) => (
                  <li
                    key={s.course_id}
                    className={`list-group-item ${
                      selectedSubject?.course_id === s.course_id
                        ? "active text-white"
                        : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedSubject(s)}
                  >
                    <div>{s.subject_name}</div>
                    <small className="text-muted">
                      {s.course_id} — {s.semester}
                    </small>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card mb-3">
            <div className="card-header">
              Sessions for{" "}
              {selectedSubject
                ? selectedSubject.subject_name
                : "(choose a course)"}
            </div>
            <div
              className="card-body"
              style={{ maxHeight: 140, overflowY: "auto" }}
            >
              {days.length === 0 ? (
                <div>No scheduled sessions.</div>
              ) : (
                <div className="btn-group" role="group">
                  {days.map((d) => (
                    <button
                      key={d}
                      className={`btn ${
                        selectedDay === d
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setSelectedDay(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              Attendance for: {selectedDay ?? "(select a day)"}
            </div>
            <div className="card-body p-0">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Present</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st, idx) => {
                    const rec = attendance[st.student_id] || { present: true };
                    return (
                      <tr
                        key={st.student_id}
                        className={!rec.present ? "table-danger" : ""}
                      >
                        <td>{idx + 1}</td>
                        <td>{st.name}</td>
                        <td>{st.student_id}</td>
                        <td>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`present-${st.student_id}`}
                              checked={rec.present}
                              onChange={() => togglePresent(st.student_id)}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`present-${st.student_id}`}
                            >
                              Present
                            </label>
                          </div>
                        </td>
                        <td>
                          <input
                            className="form-control"
                            value={rec.reason ?? ""}
                            onChange={(e) =>
                              setReason(st.student_id, e.target.value)
                            }
                            placeholder="Optional note"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-3">
                        No students for this course.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
