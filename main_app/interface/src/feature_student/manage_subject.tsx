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

  // GPA info
  const [gpaInfo, setGpaInfo] = useState<{
    credits: number;
    gpa: number;
  } | null>(null);

  const studentId = JSON.parse(localStorage.getItem("info") || "{}")?.school_id;

  // --- Load course list ---
  useEffect(() => {
    if (!studentId) return;

    api
      .post("/get_subject2/student", [studentId])
      .then((res) => setCourses(res.data || []))
      .catch(console.error);
  }, [studentId]);

  // --- Load GPA ---
  useEffect(() => {
    if (!studentId) return;

    api
      .post("/get_gpa", [studentId])
      .then((res) => {
        if (Array.isArray(res.data)) {
          setGpaInfo({
            credits: res.data[0],
            gpa: res.data[1],
          });
        }
      })
      .catch(console.error);
  }, [studentId]);

  // --- Load score details ---
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
        {/* PAGE TITLE */}
        <div className="text-center mb-4">
          <h3 className="fw-bold">Kết quả học tập</h3>
          {/* <p className="text-muted">
            Xem GPA, tín chỉ tích lũy và danh sách môn học
          </p> */}
        </div>

        {/* GPA CARD */}
        <div className="card shadow-sm mb-4 border-0 rounded-3">
          <div className="card-body text-center">
            <h5 className="fw-bold mb-3">📊 Thông tin học tập</h5>

            {!gpaInfo ? (
              <p>Đang tải GPA...</p>
            ) : (
              <div className="d-flex justify-content-center gap-5">
                <div>
                  <p className="text-muted mb-1">Tín chỉ tích lũy</p>
                  <h4 className="fw-bold">{gpaInfo.credits}</h4>
                </div>

                <div>
                  <p className="text-muted mb-1">GPA hiện tại</p>
                  <h4 className="fw-bold">{gpaInfo.gpa.toFixed(2)}</h4>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COURSE LIST */}
        <h4 className="fw-bold mb-3">📘 Môn học của tôi</h4>

        <div className="row">
          {courses.map((c) => (
            <div className="col-md-6 mb-3" key={c.course_id}>
              <div
                className="card shadow-sm border-0 rounded-3 p-3 h-100"
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedCourse(c)}
              >
                <h5 className="fw-bold">{c.subject_name}</h5>
                <p className="text-muted mb-1">Học kỳ: {c.semester}</p>
                <small className="text-muted">Course ID: {c.course_id}</small>
              </div>
            </div>
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
      {/* HEADER */}
      <div className="mb-4">
        <button className="btn btn-outline-primary mb-3" onClick={handleBack}>
          ◀ Trở về danh sách môn học
        </button>

        <h3 className="fw-bold">
          {selectedCourse.subject_name} – {selectedCourse.semester}
        </h3>
        <p className="text-muted">Chi tiết điểm số</p>
      </div>

      {/* SCORE CARD */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body">
          {!scoreDetail ? (
            <p>Đang tải điểm...</p>
          ) : (
            <>
              <table className="table table-striped table-hover text-center align-middle">
                <thead className="table-primary">
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

              {/* FINAL RESULT */}
              <div className="mt-4">
                <h5>
                  <strong>Điểm tổng kết:</strong>{" "}
                  <span className="fw-bold text-primary">
                    {scoreDetail.final_result ?? "Chưa có"}
                  </span>
                </h5>
              </div>

              {/* ABSENT DAYS */}
              <div className="mt-2">
                <h5>
                  <strong>% Số buổi nghỉ:</strong>{" "}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
