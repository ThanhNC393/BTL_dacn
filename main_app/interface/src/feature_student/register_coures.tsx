import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

interface CourseInfo {
  semester_id: string;
  subject_id: string; // tên môn học
  teacher_id: string; // tên GV
}

export default function CourseRegistration() {
  const [courses, setCourses] = useState<Record<string, CourseInfo>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Lấy student_id từ localStorage
  const studentId = JSON.parse(localStorage.getItem("info") || "{}")?.school_id;

  // --- FETCH COURSE LIST ---
  useEffect(() => {
    api
      .post("/get_courses2", [])
      .then((res) => {
        setCourses(res.data || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = async (courseId: string) => {
    if (!studentId) return alert("Không tìm thấy mã sinh viên!");

    try {
      const payload = {
        [courseId]: [studentId],
      };

      await api.post("/register_course", payload);

      alert("Đăng ký thành công!");
    } catch (err) {
      console.error(err);
      alert("Đăng ký thất bại! Vui lòng thử lại.");
    }
  };

  // --- RENDER ---
  if (loading)
    return <p className="text-center mt-5">Đang tải danh sách khóa học...</p>;
  if (!studentId) return <p>Không tìm thấy thông tin sinh viên.</p>;

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Đăng ký học phần</h3>

      <div className="row">
        {Object.entries(courses).map(([courseId, info]) => (
          <div key={courseId} className="col-md-6 col-lg-4 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{info.subject_id}</h5>

                <p className="mb-1">
                  <strong>Khóa học:</strong> {courseId}
                </p>

                <p className="mb-1">
                  <strong>Học kỳ:</strong> {info.semester_id}
                </p>

                <p className="mb-3">
                  <strong>Giảng viên:</strong> {info.teacher_id}
                </p>

                <button
                  className="btn btn-primary mt-auto"
                  onClick={() => handleRegister(courseId)}
                >
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
