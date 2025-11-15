import { useState, useEffect } from "react";
import api from "../apis";
import "bootstrap/dist/css/bootstrap.min.css";

interface Teacher {
  school_id: string;
  name: string;
}

interface Subject {
  subject_code: string;
  subject_name: string;
}

interface Semester {
  semester_id: string;
}

export default function CourseManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [cost, setCost] = useState("");

  const [courses, setCourses] = useState<Record<string, any>>({});
  const [classDayInput, setClassDayInput] = useState("");

  // Load teachers
  useEffect(() => {
    api
      .post("/get_teachers", [])
      .then((res) => {
        const list = Object.values(res.data).map((t: any) => ({
          school_id: t.school_id,
          name: t.name,
        }));
        setTeachers(list);
      })
      .catch(console.error);
  }, []);

  // Load subjects
  useEffect(() => {
    api
      .post("/get_subjects", [])
      .then((res) => {
        const list = res.data.map((s: any) => ({
          subject_code: s.subject_code,
          subject_name: s.subject_name,
        }));
        setSubjects(list);
      })
      .catch(console.error);
  }, []);

  // Load semesters
  useEffect(() => {
    api
      .post("/get_semesters", [])
      .then((res) => {
        const list = res.data.map((s: any) => ({
          semester_id: s.semester_id,
        }));
        setSemesters(list);
      })
      .catch(console.error);
  }, []);

  // Load courses
  const loadCourses = () => {
    api
      .post("/get_courses", [])
      .then((res) => setCourses(res.data || {}))
      .catch(console.error);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Add course
  const handleAddCourse = async () => {
    const classDayObj = parseClassDay(classDayInput);

    if (!selectedSemester || !selectedTeacher || !selectedSubject) {
      return alert("Vui lòng chọn đầy đủ Học kỳ, Giảng viên, Môn học!");
    }

    const payload = [
      {
        semester_id: selectedSemester,
        teacher_id: selectedTeacher,
        subject_id: selectedSubject,
        cost: cost,
        class_day: classDayObj,
      },
    ];

    try {
      const res = await api.post("/add_course", payload);
      alert("Thêm khóa học thành công!");

      // res.data là object mới, merge trực tiếp vào courses
      setCourses((prev) => ({ ...prev, ...res.data }));
      console.log(res.data);
      console.log(courses);

      // Reset input
      setSelectedSubject("");
      setSelectedTeacher("");
      setSelectedSemester("");
      setCost("");
      setClassDayInput("");
    } catch (err) {
      console.error(err);
      alert("Thêm khóa học thất bại!");
    }
  };

  // Delete course
  const handleDelete = async (id: string) => {
    if (!id) return;
    try {
      await api.post("/delete_course", [id]);
      alert("Xóa khóa học thành công!");

      // Cập nhật state courses
      setCourses((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error(err);
      alert("Xóa khóa học thất bại!");
    }
  };

  const parseClassDay = (text: string) => {
    const result: any = {};
    if (!text.trim()) return result;
    const parts = text.split(";");
    for (let p of parts) {
      p = p.trim();
      if (!p) continue;
      const [key, arr] = p.split(":");
      if (!key || !arr) continue;
      const cleanedKey = key.trim().replace(/"/g, "");
      const match = arr.match(/\[(.*?)\]/);
      if (!match) continue;
      const numbers = match[1]
        .split(",")
        .map((n) => Number(n.trim()))
        .filter((n) => !isNaN(n));
      result[cleanedKey] = numbers;
    }
    return result;
  };

  return (
    <div className="mt-5 p-3 border rounded">
      <h3>Quản lý khóa học</h3>

      {/* Add Course */}
      <div className="mt-3">
        <label>Môn học</label>
        <select
          className="form-select"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">-- chọn --</option>
          {subjects.map((s) => (
            <option key={s.subject_code} value={s.subject_code}>
              {s.subject_name}
            </option>
          ))}
        </select>

        <label className="mt-2">Giảng viên</label>
        <select
          className="form-select"
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          <option value="">-- chọn --</option>
          {teachers.map((t) => (
            <option key={t.school_id} value={t.school_id}>
              {t.name}
            </option>
          ))}
        </select>

        <label className="mt-2">Học kỳ</label>
        <select
          className="form-select"
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          <option value="">-- chọn --</option>
          {semesters.map((s) => (
            <option key={s.semester_id} value={s.semester_id}>
              {s.semester_id}
            </option>
          ))}
        </select>

        <label className="mt-2">Học phí</label>
        <input
          className="form-control"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
        <label className="mt-2">Class day</label>
        <input
          className="form-control"
          placeholder="Ví dụ: 3:[7,8,9]; 6:[1,2,3]"
          value={classDayInput}
          onChange={(e) => setClassDayInput(e.target.value)}
        />

        <button className="btn btn-primary mt-3" onClick={handleAddCourse}>
          Thêm khóa học
        </button>
      </div>

      {/* Course List */}
      <h5 className="mt-4">Danh sách khóa học</h5>
      <div className="mt-2">
        {Object.entries(courses).map(([key, item], idx) => (
          <div
            key={key}
            className="p-2 border rounded d-flex justify-content-between mt-2"
          >
            <span>{key}</span>
            <div>
              <button className="btn btn-warning btn-sm me-2">Sửa</button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(key)}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
