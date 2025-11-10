import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";
import Papa from "papaparse"; // <-- Thêm import này

interface Subject {
  subject_code: string;
  subject_name: string;
  number_of_credit: number;
  description: string;
  total_of_lessons: number;
  scores: string[];
  weights: number[];
}

const SubjectManager: React.FC = () => {
  // --- STATE THÊM MÔN HỌC ---
  const [newSubject, setNewSubject] = useState<Subject>({
    subject_code: "",
    subject_name: "",
    number_of_credit: 0,
    description: "",
    total_of_lessons: 0,
    scores: [],
    weights: [],
  });

  // --- STATE XÓA MÔN HỌC ---
  const [deleteCode, setDeleteCode] = useState("");

  // --- STATE SỬA MÔN HỌC ---
  const [editSubject, setEditSubject] = useState<Subject>({
    subject_code: "",
    subject_name: "",
    number_of_credit: 0,
    description: "",
    total_of_lessons: 0,
    scores: [],
    weights: [],
  });

  // --- LIST MÔN HỌC ---
  const [subjectList, setSubjectList] = useState<Subject[]>([]);

  // --- LẤY DANH SÁCH MÔN HỌC KHI MOUNT ---
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("/get_subjects"); // giả sử API trả về array Subject
        setSubjectList(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách môn học:", err);
        alert("Không thể lấy danh sách môn học!");
      }
    };
    fetchSubjects();
  }, []);

  // --- HANDLE CHỌN MÔN HỌC ĐỂ SỬA ---
  const handleSelectEditSubject = (subject_code: string) => {
    const selected = subjectList.find((s) => s.subject_code === subject_code);
    if (selected) {
      setEditSubject(selected);
    }
  };

  // --- HANDLE ADD ---
  const handleAdd = async () => {
    if (!newSubject.subject_code.trim()) return alert("Nhập mã môn học!");
    try {
      const payload = {
        [newSubject.subject_code]: {
          subject_name: newSubject.subject_name,
          number_of_credit: newSubject.number_of_credit,
          description: newSubject.description,
          total_of_lessons: newSubject.total_of_lessons,
          scores: newSubject.scores,
          weights: newSubject.weights,
        },
      };
      const res = await api.post("/add_subject", payload);
      alert("Thêm môn học thành công!");
      console.log(res.data);
      setSubjectList([...subjectList, { ...newSubject }]);
      setNewSubject({
        subject_code: "",
        subject_name: "",
        number_of_credit: 0,
        description: "",
        total_of_lessons: 0,
        scores: [],
        weights: [],
      });
    } catch (err) {
      console.error(err);
      alert("Thêm môn học thất bại!");
    }
  };

  // --- HANDLE DELETE ---
  const handleDelete = async () => {
    if (!deleteCode.trim()) return alert("Nhập mã môn học!");
    try {
      const payload = [deleteCode];
      const res = await api.post("/delete_subject", payload);
      alert("Xóa môn học thành công!");
      console.log(res.data);
      setDeleteCode("");
      setSubjectList(subjectList.filter((s) => s.subject_code !== deleteCode));
    } catch (err) {
      console.error(err);
      alert("Xóa môn học thất bại!");
    }
  };

  // --- HANDLE EDIT ---
  const handleEdit = async () => {
    if (!editSubject.subject_code.trim()) return alert("Nhập mã môn học!");
    try {
      const payload = {
        [editSubject.subject_code]: {
          subject_name: editSubject.subject_name,
          number_of_credit: editSubject.number_of_credit,
          description: editSubject.description,
          total_of_lessons: editSubject.total_of_lessons,
          scores: editSubject.scores,
          weights: editSubject.weights,
        },
      };
      const res = await api.patch("/change_info_subject", payload);
      alert("Sửa môn học thành công!");
      console.log(res.data);
      setSubjectList(
        subjectList.map((s) =>
          s.subject_code === editSubject.subject_code ? editSubject : s
        )
      );
    } catch (err) {
      console.error(err);
      alert("Sửa môn học thất bại!");
    }
  };

  // --- HANDLE CSV UPLOAD ---
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const subjects: Subject[] = results.data.map((row: any) => ({
          subject_code: row.subject_code,
          subject_name: row.subject_name,
          number_of_credit: Number(row.number_of_credit),
          description: row.description,
          total_of_lessons: Number(row.total_of_lessons),
          scores: row.scores
            ? row.scores.split(",").map((s: string) => s.trim())
            : [],
          weights: row.weights
            ? row.weights.split(",").map((n: string) => Number(n.trim()))
            : [],
        }));

        try {
          const payload: any = {};
          subjects.forEach((s) => {
            payload[s.subject_code] = {
              subject_name: s.subject_name,
              number_of_credit: s.number_of_credit,
              description: s.description,
              total_of_lessons: s.total_of_lessons,
              scores: s.scores,
              weights: s.weights,
            };
          });
          await api.post("/add_subject", payload);
          alert("Thêm nhiều môn học thành công!");
          setSubjectList([...subjectList, ...subjects]);
        } catch (err) {
          console.error(err);
          alert("Thêm môn học từ CSV thất bại, có mã môn nào đó đã tồn tại!");
        }
      },
    });
  };

  return (
    <div className="container mt-5">
      <h2>📘 Quản lý môn học</h2>

      {/* --- THÊM MÔN HỌC --- */}
      <div className="card mt-4 p-3">
        <h5>➕ Thêm môn học</h5>
        Mã môn học
        <input
          className="form-control mb-2"
          placeholder="VD: 29048FL2340"
          value={newSubject.subject_code}
          onChange={(e) =>
            setNewSubject({ ...newSubject, subject_code: e.target.value })
          }
        />
        Tên môn học
        <input
          className="form-control mb-2"
          placeholder="VD: Python"
          value={newSubject.subject_name}
          onChange={(e) =>
            setNewSubject({ ...newSubject, subject_name: e.target.value })
          }
        />
        Số tín chỉ
        <input
          type="number"
          className="form-control mb-2"
          placeholder="VD: 3"
          value={newSubject.number_of_credit}
          onChange={(e) =>
            setNewSubject({
              ...newSubject,
              number_of_credit: Number(e.target.value),
            })
          }
        />
        Mô tả
        <input
          className="form-control mb-2"
          placeholder="VD: Môn này học về Python ...."
          value={newSubject.description}
          onChange={(e) =>
            setNewSubject({ ...newSubject, description: e.target.value })
          }
        />
        Số buổi học
        <input
          type="number"
          className="form-control mb-2"
          placeholder="VD: 10"
          value={newSubject.total_of_lessons}
          onChange={(e) =>
            setNewSubject({
              ...newSubject,
              total_of_lessons: Number(e.target.value),
            })
          }
        />
        Các đầu điểm
        <input
          className="form-control mb-2"
          placeholder="VD: tx1,tx2,tx3"
          value={newSubject.scores.join(",")}
          onChange={(e) =>
            setNewSubject({
              ...newSubject,
              scores: e.target.value.split(",").map((s) => s.trim()),
            })
          }
        />
        Trọng số từng đầu điểm
        <input
          className="form-control mb-2"
          placeholder="VD: 10,10,30"
          value={newSubject.weights.join(",")}
          onChange={(e) =>
            setNewSubject({
              ...newSubject,
              weights: e.target.value.split(",").map((n) => Number(n.trim())),
            })
          }
        />
        <button className="btn btn-success" onClick={handleAdd}>
          Thêm môn học
        </button>
        {/* --- UPLOAD CSV --- */}
        <div className="mt-3">
          <h6>Thêm nhiều môn học từ CSV</h6>
          <input type="file" accept=".csv" onChange={handleCsvUpload} />
        </div>
      </div>

      {/* --- XÓA MÔN HỌC --- */}
      <div className="card mt-4 p-3">
        <h5>✏️ Xóa môn học</h5>
        Mã môn học
        <select
          className="form-select mb-2"
          value={deleteCode}
          onChange={(e) => setDeleteCode(e.target.value)}
        >
          <option value="">Chọn môn học</option>
          {subjectList.map((s) => (
            <option key={s.subject_code} value={s.subject_code}>
              {s.subject_code} - {s.subject_name}
            </option>
          ))}
        </select>
        <button className="btn btn-danger" onClick={handleDelete}>
          Xóa môn học
        </button>
      </div>

      {/* --- SỬA MÔN HỌC --- */}
      <div className="card mt-4 p-3">
        <h5>✏️ Chi tiết môn học</h5>
        {/* --- Dropdown chọn môn học --- */}
        Mã môn học
        <select
          className="form-select mb-3"
          value={editSubject.subject_code}
          onChange={(e) => handleSelectEditSubject(e.target.value)}
        >
          <option value="">Chọn môn học</option>
          {subjectList.map((s) => (
            <option key={s.subject_code} value={s.subject_code}>
              {s.subject_code} - {s.subject_name}
            </option>
          ))}
        </select>
        {editSubject.subject_code && (
          <>
            Tên môn học
            <input
              className="form-control mb-2"
              placeholder="VD: Python"
              value={editSubject.subject_name}
              onChange={(e) =>
                setEditSubject({ ...editSubject, subject_name: e.target.value })
              }
            />
            Số tín chỉ
            <input
              type="number"
              className="form-control mb-2"
              placeholder="VD: 3"
              value={editSubject.number_of_credit}
              onChange={(e) =>
                setEditSubject({
                  ...editSubject,
                  number_of_credit: Number(e.target.value),
                })
              }
            />
            Mô tả
            <input
              className="form-control mb-2"
              placeholder="VD: Môn này học về Python ...."
              value={editSubject.description}
              onChange={(e) =>
                setEditSubject({ ...editSubject, description: e.target.value })
              }
            />
            Số buổi học
            <input
              type="number"
              className="form-control mb-2"
              placeholder="VD: 10"
              value={editSubject.total_of_lessons}
              onChange={(e) =>
                setEditSubject({
                  ...editSubject,
                  total_of_lessons: Number(e.target.value),
                })
              }
            />
            Các đầu điểm
            <input
              className="form-control mb-2"
              placeholder="VD: tx1,tx2,tx3"
              value={editSubject.scores.join(",")}
              onChange={(e) =>
                setEditSubject({
                  ...editSubject,
                  scores: e.target.value.split(",").map((s) => s.trim()),
                })
              }
            />
            Trọng số từng đầu điểm
            <input
              className="form-control mb-2"
              placeholder="VD: 10,10,30"
              value={editSubject.weights.join(",")}
              onChange={(e) =>
                setEditSubject({
                  ...editSubject,
                  weights: e.target.value
                    .split(",")
                    .map((n) => Number(n.trim())),
                })
              }
            />
            <button className="btn btn-warning" onClick={handleEdit}>
              Sửa môn học
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SubjectManager;
