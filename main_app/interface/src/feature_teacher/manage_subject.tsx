import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

interface Course {
  course_id: string;
  semester: string;
  subject_id: number;
  subject_name: string;
}

interface Student {
  student_id: string;
  name: string;
  scores: (number | null)[];
  scores_name: string[];
  final_result: number | null;
}

export default function TeacherSubjects() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [editedScores, setEditedScores] = useState<
    Record<string, Record<string, number | null>>
  >({});

  const teacherId = JSON.parse(localStorage.getItem("info") || "{}")?.school_id;

  // --- Load courses ---
  useEffect(() => {
    if (!teacherId) return;
    api
      .post("/get_subject2/teacher", [teacherId])
      .then((res) => setCourses(res.data || []))
      .catch(console.error);
  }, [teacherId]);

  // --- Load students of selected course ---
  useEffect(() => {
    if (!selectedCourse) return;
    api
      .post("/get_students_of_course", [selectedCourse.course_id])
      .then((res) => {
        setStudents(res.data || []);
        // init editedScores
        const initScores: Record<string, Record<string, number | null>> = {};
        res.data.forEach((stu: Student) => {
          initScores[stu.student_id] = {};
          stu.scores_name.forEach((scoreName, idx) => {
            initScores[stu.student_id][scoreName] = stu.scores[idx];
          });
        });
        setEditedScores(initScores);
      })
      .catch(console.error);
  }, [selectedCourse]);

  const handleScoreChange = (
    studentId: string,
    scoreName: string,
    value: string
  ) => {
    const num = value === "" ? null : Number(value);
    setEditedScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [scoreName]: num,
      },
    }));
  };

  const handleSaveScores = async () => {
    if (!selectedCourse) return;
    try {
      const payload = {
        [selectedCourse.course_id]: editedScores,
      };
      await api.post("/enter_score", payload);
      alert("Lưu điểm thành công!");
    } catch (err) {
      console.error(err);
      alert("Lưu điểm thất bại!");
    }
  };

  const handleBack = () => {
    setSelectedCourse(null);
    setStudents([]);
    setEditedScores({});
  };

  // --- RENDER ---
  if (!teacherId) return <p>Không tìm thấy thông tin giảng viên.</p>;

  if (!selectedCourse) {
    // màn hình danh sách môn học
    return (
      <div className="container mt-4">
        <h3>Môn giảng dạy</h3>
        <div className="list-group mt-3">
          {courses.map((c) => (
            <button
              key={c.course_id}
              className="list-group-item list-group-item-action mb-2 rounded shadow-sm p-3 text-start"
              onClick={() => setSelectedCourse(c)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">{c.subject_name}</span>
                <span className="text-muted">{c.semester}</span>
              </div>
              <small className="text-muted">Course ID: {c.course_id}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // màn hình chi tiết môn học
  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-body">
          <button className="btn btn-secondary mb-3" onClick={handleBack}>
            ◀ Trở về danh sách môn học
          </button>

          <h4 className="mb-3">
            {selectedCourse.subject_name} - {selectedCourse.semester}
          </h4>

          <div className="table-responsive">
            <table className="table table-bordered table-hover table-striped align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th>STT</th>
                  <th>Mã SV</th>
                  <th className="text-start ps-3">Họ tên</th>
                  {students[0]?.scores_name.map((sName) => (
                    <th key={sName}>{sName}</th>
                  ))}
                  <th>Điểm tổng kết</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu, idx) => (
                  <tr key={stu.student_id}>
                    <td>{idx + 1}</td>
                    <td>{stu.student_id}</td>
                    <td className="text-start ps-3">{stu.name}</td>
                    {stu.scores_name.map((sName) => (
                      <td key={sName}>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          className={`form-control ${
                            editedScores[stu.student_id]?.[sName] === null
                              ? "bg-warning"
                              : ""
                          }`}
                          placeholder="Chưa nhập"
                          value={editedScores[stu.student_id]?.[sName] ?? ""}
                          onChange={(e) =>
                            handleScoreChange(
                              stu.student_id,
                              sName,
                              e.target.value
                            )
                          }
                        />
                      </td>
                    ))}
                    <td>{stu.final_result ?? "Chưa có"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-primary" onClick={handleSaveScores}>
              Lưu điểm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
