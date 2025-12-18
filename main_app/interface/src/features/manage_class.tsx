import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

interface ClassInfo {
  name: string;
  estab_date: string;
}

/* ================== DATE HELPERS ================== */
// backend (dd-mm-yyyy | dd/mm/yyyy) -> input (yyyy-mm-dd)
const toInputDate = (dateStr: string) => {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts[0].length === 4) return dateStr; // đã đúng yyyy-mm-dd
    const [d, m, y] = parts;
    return `${y}-${m}-${d}`;
  }
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m}-${d}`;
  }
  return "";
};

// input (yyyy-mm-dd) -> backend (dd-mm-yyyy)
const toBackendDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
};

const ClassManager: React.FC = () => {
  /* ================== STATE ================== */
  const [newClass, setNewClass] = useState<ClassInfo>({
    name: "",
    estab_date: "",
  });

  const [deleteName, setDeleteName] = useState("");

  const [editClass, setEditClass] = useState<ClassInfo>({
    name: "",
    estab_date: "",
  });

  const [classList, setClassList] = useState<ClassInfo[]>([]);

  /* ================== FETCH ================== */
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.post("/get_class", []);
        setClassList(res.data);
      } catch (err) {
        console.error(err);
        alert("Không thể lấy danh sách lớp!");
      }
    };
    fetchClasses();
  }, []);

  /* ================== HANDLERS ================== */
  const handleSelectEditClass = (name: string) => {
    const selected = classList.find((c) => c.name === name);
    if (!selected) return;

    setEditClass({
      name: selected.name,
      estab_date: toInputDate(selected.estab_date),
    });
  };

  const handleAdd = async () => {
    if (!newClass.name.trim()) return alert("Nhập tên lớp!");

    try {
      const payload = {
        1: {
          name: newClass.name,
          estab_date: toBackendDate(newClass.estab_date),
        },
      };

      await api.post("/add_class", payload);

      setClassList([
        ...classList,
        {
          name: newClass.name,
          estab_date: payload[1].estab_date,
        },
      ]);

      setNewClass({ name: "", estab_date: "" });
      alert("Thêm lớp học thành công!");
    } catch (err) {
      console.error(err);
      alert("Thêm lớp học thất bại!");
    }
  };

  const handleDelete = async () => {
    if (!deleteName) return alert("Chọn lớp để xóa!");
    try {
      await api.post("/delete_class", [deleteName]);
      setClassList(classList.filter((c) => c.name !== deleteName));
      setDeleteName("");
      alert("Xóa lớp thành công!");
    } catch (err) {
      console.error(err);
      alert("Xóa lớp thất bại!");
    }
  };

  const handleEdit = async () => {
    if (!editClass.name) return alert("Chọn lớp để sửa!");

    try {
      const payload = {
        [editClass.name]: {
          name: editClass.name,
          estab_date: toBackendDate(editClass.estab_date),
        },
      };

      await api.patch("/change_info_class", payload);

      setClassList(
        classList.map((c) =>
          c.name === editClass.name
            ? { ...c, estab_date: payload[editClass.name].estab_date }
            : c
        )
      );

      alert("Sửa lớp học thành công!");
    } catch (err) {
      console.error(err);
      alert("Sửa lớp học thất bại!");
    }
  };

  /* ================== UI ================== */
  return (
    <div className="container mt-5">
      <h2>🏫 Quản lý lớp học</h2>

      {/* ===== THÊM LỚP ===== */}
      <div className="card mt-4 p-3">
        <h5>➕ Thêm lớp học</h5>
        Tên lớp
        <input
          className="form-control mb-2"
          value={newClass.name}
          onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
        />
        Ngày thành lập
        <input
          type="date"
          className="form-control mb-2"
          value={newClass.estab_date}
          onChange={(e) =>
            setNewClass({ ...newClass, estab_date: e.target.value })
          }
        />
        <button className="btn btn-success" onClick={handleAdd}>
          Thêm lớp
        </button>
      </div>

      {/* ===== XÓA LỚP ===== */}
      <div className="card mt-4 p-3">
        <h5>🗑 Xóa lớp học</h5>

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

      {/* ===== SỬA LỚP ===== */}
      <div className="card mt-4 p-3">
        <h5>✏️ Sửa thông tin lớp học</h5>

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
              disabled
            />
            Ngày thành lập
            <input
              type="date"
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
