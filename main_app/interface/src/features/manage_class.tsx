import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

interface ClassInfo {
  name: string;
  estab_date: string;
}

const ClassManager: React.FC = () => {
  // --- STATE THÊM LỚP ---
  const [newClass, setNewClass] = useState<ClassInfo>({
    name: "",
    estab_date: "",
  });

  // --- STATE XÓA LỚP ---
  const [deleteName, setDeleteName] = useState("");

  // --- STATE SỬA LỚP ---
  const [editClass, setEditClass] = useState<ClassInfo>({
    name: "",
    estab_date: "",
  });

  // --- LIST LỚP ---
  const [classList, setClassList] = useState<ClassInfo[]>([]);

  // --- LẤY DANH SÁCH LỚP KHI MOUNT ---
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.post("/get_class", []); // API trả về array ClassInfo
        setClassList(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách lớp:", err);
        alert("Không thể lấy danh sách lớp!");
      }
    };
    fetchClasses();
  }, []);

  // --- HANDLE CHỌN LỚP ĐỂ SỬA ---
  const handleSelectEditClass = (name: string) => {
    const selected = classList.find((c) => c.name === name);
    if (selected) setEditClass(selected);
  };

  // --- HANDLE ADD ---
  const handleAdd = async () => {
    if (!newClass.name.trim()) return alert("Nhập tên lớp!");
    try {
      const payload = {
        1: {
          name: newClass.name,
          estab_date: newClass.estab_date,
        },
      };
      await api.post("/add_class", payload);
      alert("Thêm lớp học thành công!");
      setClassList([...classList, { ...newClass }]);
      setNewClass({ name: "", estab_date: "" });
    } catch (err) {
      console.error(err);
      alert("Thêm lớp học thất bại!");
    }
  };

  // --- HANDLE DELETE ---
  const handleDelete = async () => {
    if (!deleteName.trim()) return alert("Chọn lớp để xóa!");
    try {
      await api.post("/delete_class", [deleteName]);
      alert("Xóa lớp thành công!");
      setClassList(classList.filter((c) => c.name !== deleteName));
      setDeleteName("");
    } catch (err) {
      console.error(err);
      alert("Xóa lớp thất bại!");
    }
  };

  // --- HANDLE EDIT ---
  const handleEdit = async () => {
    if (!editClass.name.trim()) return alert("Chọn lớp để sửa!");
    try {
      const payload = {
        [editClass.name]: {
          name: editClass.name,
          estab_date: editClass.estab_date,
        },
      };
      await api.patch("/change_info_class", payload);
      alert("Sửa lớp học thành công!");
      setClassList(
        classList.map((c) => (c.name === editClass.name ? { ...editClass } : c))
      );
    } catch (err) {
      console.error(err);
      alert("Sửa lớp học thất bại!");
    }
  };

  return (
    <div className="container mt-5">
      <h2>🏫 Quản lý lớp học</h2>

      {/* --- THÊM LỚP --- */}
      <div className="card mt-4 p-3">
        <h5>➕ Thêm lớp học</h5>
        Tên lớp
        <input
          className="form-control mb-2"
          placeholder="VD: CNTT11"
          value={newClass.name}
          onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
        />
        Ngày thành lập
        <input
          className="form-control mb-2"
          placeholder="VD: 10/10/2020"
          value={newClass.estab_date}
          onChange={(e) =>
            setNewClass({ ...newClass, estab_date: e.target.value })
          }
        />
        <button className="btn btn-success" onClick={handleAdd}>
          Thêm lớp
        </button>
      </div>

      {/* --- XÓA LỚP --- */}
      <div className="card mt-4 p-3">
        <h5>🗑 Xóa lớp học</h5>
        Chọn lớp
        <select
          className="form-select mb-2"
          value={deleteName}
          onChange={(e) => setDeleteName(e.target.value)}
        >
          <option value="">Chọn lớp</option>
          {classList.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} - {c.estab_date}
            </option>
          ))}
        </select>
        <button className="btn btn-danger" onClick={handleDelete}>
          Xóa lớp
        </button>
      </div>

      {/* --- SỬA LỚP --- */}
      <div className="card mt-4 p-3">
        <h5>✏️ Sửa thông tin lớp học</h5>
        Chọn lớp
        <select
          className="form-select mb-3"
          value={editClass.name}
          onChange={(e) => handleSelectEditClass(e.target.value)}
        >
          <option value="">Chọn lớp</option>
          {classList.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} - {c.estab_date}
            </option>
          ))}
        </select>
        {editClass.name && (
          <>
            Tên lớp
            <input
              className="form-control mb-2"
              value={editClass.name}
              onChange={(e) =>
                setEditClass({ ...editClass, name: e.target.value })
              }
            />
            Ngày thành lập
            <input
              className="form-control mb-2"
              value={editClass.estab_date}
              onChange={(e) =>
                setEditClass({ ...editClass, estab_date: e.target.value })
              }
            />
            <button className="btn btn-warning" onClick={handleEdit}>
              Sửa lớp
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ClassManager;
