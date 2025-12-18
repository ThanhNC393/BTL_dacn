import { useState, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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
  const [announcement, setAnnouncement] = useState("");
  const [sending, setSending] = useState(false);

  // ---------- LOAD COURSES ----------
  useEffect(() => {
    if (!teacherId) return;
    api
      .post("/get_subject2/teacher", [teacherId])
      .then((res) => setCourses(res.data || []))
      .catch(console.error);
  }, [teacherId]);

  // ---------- LOAD STUDENTS ----------
  useEffect(() => {
    if (!selectedCourse) return;
    api
      .post("/get_students_of_course", [selectedCourse.course_id])
      .then((res) => {
        setStudents(res.data || []);
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

  const handleSendAnnouncement = async () => {
    if (!selectedCourse) return;
    if (!announcement.trim()) {
      alert("Vui lòng nhập nội dung thông báo!");
      return;
    }

    try {
      setSending(true);
      const payload = [selectedCourse.course_id, announcement.trim()];

      await api.post("/announcement", payload);
      alert("Đã gửi thông báo cho sinh viên!");
      setAnnouncement("");
    } catch (err) {
      console.error(err);
      alert("Gửi thông báo thất bại!");
    } finally {
      setSending(false);
    }
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

  // ================= GPA LOGIC =================

  const scoreToGPA = (score: number | null) => {
    if (score === null) return null;
    if (score >= 8.5) return "A";
    if (score >= 7.7) return "B+";
    if (score >= 7.0) return "B";
    if (score >= 6.2) return "C+";
    if (score >= 5.5) return "C";
    if (score >= 4.7) return "D+";
    if (score >= 4.0) return "D";
    return "F";
  };

  const gpaOrder = ["A", "B+", "B", "C+", "C", "D+", "D", "F"];

  const gpaStats = useMemo(() => {
    const stats: Record<string, number> = {};
    gpaOrder.forEach((g) => (stats[g] = 0));

    students.forEach((stu) => {
      const gpa = scoreToGPA(stu.final_result);
      if (gpa) stats[gpa]++;
    });

    return stats;
  }, [students]);

  // ---------- DATA FOR BAR CHART ----------
  const barData = {
    labels: gpaOrder,
    datasets: [
      {
        label: "Số sinh viên",
        data: gpaOrder.map((g) => gpaStats[g]),
        backgroundColor: "#0d6efd",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: "Số sinh viên",
        },
      },
      x: {
        title: {
          display: true,
          text: "Xếp loại",
        },
      },
    },
  };

  // ================= RENDER =================

  if (!teacherId) return <p>Không tìm thấy thông tin giảng viên.</p>;

  if (!selectedCourse) {
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

          {/* ===== TABLE ===== */}
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
                          className="form-control"
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

          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-primary" onClick={handleSaveScores}>
              Lưu điểm
            </button>
          </div>

          {/* 🔔 ANNOUNCEMENT */}
          <div className="card my-4 shadow-sm">
            <div className="card-body">
              <h5>📢 Gửi thông báo cho lớp</h5>
              <textarea
                className="form-control mt-2"
                rows={3}
                placeholder="Nhập nội dung thông báo..."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
              />
              <div className="text-end mt-2">
                <button
                  className="btn btn-warning"
                  onClick={handleSendAnnouncement}
                  disabled={sending}
                >
                  {sending ? "Đang gửi..." : "Gửi thông báo"}
                </button>
              </div>
            </div>
          </div>
          {/* ===== BAR CHART GPA ===== */}
          <div className="mt-5">
            <h5 className="mb-3">📊 Thống kê điểm </h5>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
