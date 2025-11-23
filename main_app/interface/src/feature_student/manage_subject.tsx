import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

interface Course {
  course_id: string;
  semester: string;
  subject_id: number;
  subject_name: string;
}

interface ScoreDetail {
  scores: number[];
  scores_name: string[];
  final_result: number | null;
  off_days: number | null;
}

export default function StudentSubjects() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [scoreDetail, setScoreDetail] = useState<ScoreDetail | null>(null);

  const studentId = JSON.parse(localStorage.getItem("info") || "{}")?.school_id;

  // --- Load course list for student ---
  useEffect(() => {
    if (!studentId) return;

    api
      .post("/get_subject2/student", [studentId])
      .then((res) => setCourses(res.data || []))
      .catch(console.error);
  }, [studentId]);

  // --- Load score of selected course ---
  useEffect(() => {
    if (!selectedCourse) return;

    api
      .post("/get_score", [studentId, selectedCourse.course_id])
      .then((res) => setScoreDetail(res.data))
      .catch(console.error);
  }, [selectedCourse]);

  const handleBack = () => {
    setSelectedCourse(null);
    setScoreDetail(null);
  };

  if (!studentId) return <p>Không tìm thấy thông tin sinh viên.</p>;

  // ===============================
  // ========== COURSE LIST =========
  // ===============================
  if (!selectedCourse) {
    return (
      <div className="container mt-4">
        <h3>Môn học của tôi</h3>
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

  // ===============================
  // ======== SCORE DETAILS ========
  // ===============================
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

          {!scoreDetail ? (
            <p>Đang tải điểm...</p>
          ) : (
            <div>
              <table className="table table-bordered table-striped text-center">
                <thead>
                  <tr>
                    <th>Thành phần</th>
                    <th>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreDetail.scores_name.map((label, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold text-uppercase">{label}</td>
                      <td>{scoreDetail.scores[idx]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h5 className="mt-3">
                Điểm tổng kết:{" "}
                <span className="fw-bold">
                  {scoreDetail.final_result ?? "Chưa có"}
                </span>
              </h5>

              <h5 className="mt-2">
                % Số buổi nghỉ:{" "}
                <span
                  className="fw-bold"
                  style={{
                    color:
                      scoreDetail.off_days && scoreDetail.off_days > 30
                        ? "red"
                        : "inherit",
                  }}
                >
                  {scoreDetail.off_days ?? "Chưa có"}
                </span>
                {scoreDetail.off_days && scoreDetail.off_days > 30 && (
                  <span className="text-danger fw-semibold ms-2">
                    (Đã nghỉ quá số buổi cho phép!)
                  </span>
                )}
              </h5>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
