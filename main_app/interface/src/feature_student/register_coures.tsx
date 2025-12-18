import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

interface CourseInfo {
  semester_id: string;
  subject_id: string;
  teacher_id: string;
  schedule: Record<string, number[]>;
}

interface RegisteredCourseInfo {
  subject_name: string;
  teacher_id: string;
  schedule: Record<string, number[]>;
}

export default function CourseRegistration() {
  const [courses, setCourses] = useState<Record<string, CourseInfo>>({});
  const [registeredCourses, setRegisteredCourses] = useState<
    Record<string, RegisteredCourseInfo>
  >({});
  const [loading, setLoading] = useState<boolean>(true);

  // trigger reload
  const [reloadKey, setReloadKey] = useState(0);

  const studentId = JSON.parse(localStorage.getItem("info") || "{}")?.school_id;

  // =========================
  // RENDER SCHEDULE (OBJECT)
  // =========================
  const renderSchedule = (schedule?: Record<string, number[]>) => {
    if (!schedule || Object.keys(schedule).length === 0) {
      return <span className="text-muted">Chưa có lịch</span>;
    }

    return (
      <ul className="mb-0">
        {Object.entries(schedule).map(([day, periods]) => (
          <li key={day}>
            Thứ {day}: tiết {periods.join(", ")}
          </li>
        ))}
      </ul>
    );
  };

  // =========================
  // FETCH DATA
  // =========================
  const fetchAllData = async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      const [availableRes, registeredRes] = await Promise.all([
        api.post("/get_courses2", [studentId]),
        api.post("/get_courses3", [studentId]),
      ]);

      setCourses(availableRes.data || {});
      setRegisteredCourses(registeredRes.data || {});
    } catch (err) {
      console.error(err);
      setCourses({});
      setRegisteredCourses({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [studentId, reloadKey]);

  // =========================
  // REGISTER
  // =========================
  const handleRegister = async (courseId: string) => {
    try {
      const payload = { [courseId]: [studentId] };
      await api.post("/register_course", payload);

      alert("Đăng ký thành công!");
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Đăng ký thất bại!");
    }
  };

  // =========================
  // UNREGISTER
  // =========================
  const handleUnregister = async (courseId: string) => {
    if (!window.confirm("Bạn có chắc muốn hủy đăng ký học phần này?")) return;

    try {
      await api.post("/unregister_course", [courseId, studentId]);
      alert("Hủy đăng ký thành công!");
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Hủy đăng ký thất bại!");
    }
  };

  // =========================
  // RENDER
  // =========================
  if (loading) return <p className="text-center mt-5">Đang tải dữ liệu...</p>;

  if (!studentId)
    return (
      <p className="text-center mt-5">Không tìm thấy thông tin sinh viên.</p>
    );

  return (
    <div className="container mt-4">
      {/* ===================== */}
      {/* ĐÃ ĐĂNG KÝ */}
      {/* ===================== */}
      <h4 className="mb-3 text-success">📚 Học phần đã đăng ký</h4>

      {Object.keys(registeredCourses).length === 0 ? (
        <p className="text-muted">Chưa đăng ký học phần nào.</p>
      ) : (
        <div className="row mb-5">
          {Object.entries(registeredCourses).map(([courseId, info]) => (
            <div key={courseId} className="col-md-6 col-lg-4 mb-3">
              <div className="card border-success h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{info.subject_name}</h5>

                  <p>
                    <strong>Mã HP:</strong> {courseId}
                  </p>
                  <p>
                    <strong>GV:</strong> {info.teacher_id}
                  </p>

                  <div className="mb-2">
                    <strong>Lịch học:</strong>
                    {renderSchedule(info.schedule)}
                  </div>

                  <button
                    className="btn btn-outline-danger mt-auto"
                    onClick={() => handleUnregister(courseId)}
                  >
                    Hủy đăng ký
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================== */}
      {/* ĐĂNG KÝ */}
      {/* ===================== */}
      <h4 className="mb-3">📝 Đăng ký học phần</h4>

      {Object.keys(courses).length === 0 ? (
        <p className="text-muted">Không có học phần khả dụng.</p>
      ) : (
        <div className="row">
          {Object.entries(courses).map(([courseId, info]) => (
            <div key={courseId} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{info.subject_id}</h5>

                  <p>
                    <strong>Mã HP:</strong> {courseId}
                  </p>
                  <p>
                    <strong>Học kỳ:</strong> {info.semester_id}
                  </p>
                  <p>
                    <strong>GV:</strong> {info.teacher_id}
                  </p>

                  <div className="mb-2">
                    <strong>Lịch học:</strong>
                    {renderSchedule(info.schedule)}
                  </div>

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
      )}
    </div>
  );
}
