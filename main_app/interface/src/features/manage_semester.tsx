import React, { useState, useEffect, type ChangeEvent } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Papa from "papaparse";
import api from "../apis";

interface Semester {
  year: string;
  start_date: string;
  finish_date: string;
}

interface SemesterItem {
  semester_id: string;
  data: Semester;
}

const SemesterManager: React.FC = () => {
  // --- STATES ---
  const [newSemester, setNewSemester] = useState<Semester>({
    year: "",
    start_date: "",
    finish_date: "",
  });
  const [editSemester, setEditSemester] = useState<Semester>({
    year: "",
    start_date: "",
    finish_date: "",
  });
  const [editKey, setEditKey] = useState<string>("");

  const [semesterList, setSemesterList] = useState<SemesterItem[]>([]);

  // --- FETCH SEMESTERS ---
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await api.get("/get_semesters");
        // --- IMPORTANT ---
        // API trả về MẢNG các object mỗi object có trường semester_id.
        // Không dùng Object.entries trên mảng (sẽ tạo keys "0","1",...) — đó chính là nguyên nhân bị chuyển thành số.
        const arr: SemesterItem[] = (res.data as any[]).map((item) => ({
          semester_id: String(item.semester_id),
          data: {
            year: String(item.year),
            start_date: String(item.start_date),
            finish_date: String(item.finish_date),
          },
        }));
        setSemesterList(arr);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách học kỳ:", err);
        alert("Không thể lấy danh sách học kỳ!");
      }
    };
    fetchSemesters();
  }, []);

  // --- HANDLE ADD SINGLE SEMESTER ---
  const handleAdd = async () => {
    if (!newSemester.year.trim()) return alert("Nhập năm học kỳ!");
    try {
      const payload = [newSemester];
      // Gọi API, mong server trả về created items (tốt nhất)
      const res = await api.post("/add_semester", payload);
      alert("Thêm học kỳ thành công!");

      const added: SemesterItem[] = (res.data as any[]).map((it) => ({
        semester_id: String(it.semester_id),
        data: {
          year: String(it.year),
          start_date: String(it.start_date),
          finish_date: String(it.finish_date),
        },
      }));
      console.log(added);
      setSemesterList((prev) => [...prev, ...added]);

      setNewSemester({ year: "", start_date: "", finish_date: "" });
    } catch (err) {
      console.error(err);
      alert("Thêm học kỳ thất bại!");
    }
  };

  // --- HANDLE SELECT FOR EDIT ---
  const handleSelectEditSemester = (semester_id: string) => {
    const selected = semesterList.find((s) => s.semester_id === semester_id);
    if (selected) {
      setEditSemester(selected.data);
      setEditKey(selected.semester_id);
    } else {
      // nếu chọn rỗng hoặc không tìm thấy:
      setEditSemester({ year: "", start_date: "", finish_date: "" });
      setEditKey("");
    }
  };

  // --- HANDLE EDIT ---
  const handleEdit = async () => {
    if (!editKey.trim()) return alert("Chọn học kỳ để sửa!");
    try {
      const payload = { [editKey]: editSemester };
      const res = await api.patch("/change_info_semester", payload);
      alert("Sửa học kỳ thành công!");

      // Nếu API trả về object chứa updated items, bạn có thể merge; nhưng để đơn giản:
      setSemesterList((prev) =>
        prev.map((s) =>
          s.semester_id === editKey ? { ...s, data: editSemester } : s
        )
      );

      setEditKey("");
      setEditSemester({ year: "", start_date: "", finish_date: "" });
    } catch (err) {
      console.error(err);
      alert("Sửa học kỳ thất bại!");
    }
  };

  // --- HANDLE DELETE ---
  const handleDelete = async () => {
    if (!editKey.trim()) return alert("Chọn học kỳ để xóa!");
    try {
      await api.post("/delete_semester", [editKey]);
      alert("Xóa học kỳ thành công!");
      setSemesterList((prev) => prev.filter((s) => s.semester_id !== editKey));
      setEditKey("");
      setEditSemester({ year: "", start_date: "", finish_date: "" });
    } catch (err) {
      console.error(err);
      alert("Xóa học kỳ thất bại!");
    }
  };

  // --- HANDLE UPLOAD CSV ---
  const handleCSVUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // results.data là mảng các row; mỗi row có year,start_date,finish_date
          const rows = results.data as any[];

          // chuẩn hoá từng item to Semester
          const semestersToAdd: Semester[] = rows.map((r) => ({
            year: String(r.year),
            start_date: String(r.start_date),
            finish_date: String(r.finish_date),
          }));

          // Gửi lên API
          const res = await api.post("/add_semester", semestersToAdd);
          alert("Tải CSV và thêm học kỳ thành công!");

          // Nếu server trả về created items (mảng có semester_id), dùng nó
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            const added: SemesterItem[] = (res.data as any[]).map((it) => ({
              semester_id: String(it.semester_id),
              data: {
                year: String(it.year),
                start_date: String(it.start_date),
                finish_date: String(it.finish_date),
              },
            }));
            setSemesterList((prev) => [...prev, ...added]);
          } else {
            // fallback: tạo semester_id tạm bằng year + timestamp offset
            const startIdx = semesterList.length;
            const added: SemesterItem[] = semestersToAdd.map((item, i) => ({
              semester_id: `${item.year}_${Date.now()}_${i}`,
              data: item,
            }));
            setSemesterList((prev) => [...prev, ...added]);
          }
        } catch (err) {
          console.error("Lỗi khi tải CSV:", err);
          alert("Lỗi khi thêm học kỳ từ CSV!");
        }
      },
    });
  };

  return (
    <div className="container mt-5">
      <h2>📘 Quản lý học kỳ</h2>

      {/* --- THÊM HỌC KỲ --- */}
      <div className="card mt-4 p-3">
        <h5>➕ Thêm học kỳ</h5>
        <input
          className="form-control mb-2"
          placeholder="Năm học (VD: 2025)"
          value={newSemester.year}
          onChange={(e) =>
            setNewSemester({ ...newSemester, year: e.target.value })
          }
        />
        <input
          className="form-control mb-2"
          placeholder="Ngày bắt đầu (VD: 10/10)"
          value={newSemester.start_date}
          onChange={(e) =>
            setNewSemester({ ...newSemester, start_date: e.target.value })
          }
        />
        <input
          className="form-control mb-3"
          placeholder="Ngày kết thúc (VD: 02/01)"
          value={newSemester.finish_date}
          onChange={(e) =>
            setNewSemester({ ...newSemester, finish_date: e.target.value })
          }
        />
        <div className="d-flex align-items-center">
          <button className="btn btn-success me-3" onClick={handleAdd}>
            Thêm học kỳ
          </button>
          <label
            className="btn btn-secondary mb-0"
            style={{ cursor: "pointer" }}
          >
            Tải CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleCSVUpload}
            />
          </label>
        </div>
      </div>

      {/* --- CHỈNH SỬA HỌC KỲ --- */}
      <div className="card mt-4 p-3">
        <h5>✏️ Sửa hoặc xóa học kỳ</h5>
        <select
          className="form-select mb-3"
          value={editKey}
          onChange={(e) => handleSelectEditSemester(e.target.value)}
        >
          <option value="">Chọn học kỳ</option>
          {semesterList.map((s) => (
            <option key={s.semester_id} value={s.semester_id}>
              {s.semester_id} - {s.data.year}
            </option>
          ))}
        </select>

        {editKey && (
          <>
            <input
              className="form-control mb-2"
              placeholder="Năm học"
              value={editSemester.year}
              onChange={(e) =>
                setEditSemester({ ...editSemester, year: e.target.value })
              }
            />
            <input
              className="form-control mb-2"
              placeholder="Ngày bắt đầu"
              value={editSemester.start_date}
              onChange={(e) =>
                setEditSemester({ ...editSemester, start_date: e.target.value })
              }
            />
            <input
              className="form-control mb-3"
              placeholder="Ngày kết thúc"
              value={editSemester.finish_date}
              onChange={(e) =>
                setEditSemester({
                  ...editSemester,
                  finish_date: e.target.value,
                })
              }
            />
            <div className="d-flex">
              <button
                className="btn btn-warning flex-fill me-2"
                onClick={handleEdit}
              >
                ✏️ Sửa học kỳ
              </button>
              <button
                className="btn btn-danger flex-fill"
                onClick={handleDelete}
              >
                🗑️ Xóa học kỳ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SemesterManager;
