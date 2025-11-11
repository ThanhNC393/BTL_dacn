import React, { useEffect, useState } from "react";
import api from "../apis";
import Papa from "papaparse";

interface Account {
  school_id?: string;
  name: string;
  personal_id: string;
  phone_number: string;
  address: string;
  date_of_joining: string;
  email: string;
  class_name?: string;
  role?: number;
}

const AccountManager: React.FC = () => {
  const [roleType, setRoleType] = useState<"student" | "teacher">("student");
  const [accountList, setAccountList] = useState<Account[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<Account>>({});
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Account>>({});

  // --- LẤY DANH SÁCH LỚP (dropdown) ---
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.post("/get_class", []);
        let data = res.data;
        if (!Array.isArray(data)) data = Object.values(data || {});
        const names = data.map((cls: any) => cls.name);
        setClassList(names);
      } catch (err) {
        console.error(err);
        setClassList([]);
      }
    };
    fetchClasses();
  }, []);

  // --- LẤY DANH SÁCH TÀI KHOẢN ---
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const endpoint =
          roleType === "student" ? "/get_students" : "/get_teachers";
        const res = await api.post(endpoint, []);
        let data = res.data;

        if (!Array.isArray(data)) {
          data = Object.entries(data || {}).map(
            ([id, info]: [string, any]) => ({
              school_id: id,
              ...info,
            })
          );
        }

        setAccountList(data);
      } catch (err) {
        console.error(err);
        setAccountList([]);
      }
    };
    fetchAccounts();
  }, [roleType]);

  // --- XỬ LÝ THAY ĐỔI FORM ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // --- THÊM MỚI (1 account) ---
  const handleAdd = async () => {
    try {
      const endpoint =
        roleType === "student" ? "/register_student" : "/register_teacher";

      const res = await api.post(endpoint, formData);

      const newAccounts: Account[] = res.data || [];

      setAccountList([...accountList, ...newAccounts]);
      setFormData({});
      alert("Thêm thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi thêm!");
    }
  };

  // --- THÊM HÀNG LOẠT CSV ---
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true, // CSV có header trùng với tên key của Account
      skipEmptyLines: true,
      complete: async (results) => {
        const csvData: Account[] = results.data as Account[];

        // Nếu là giảng viên thì xóa class_name
        if (roleType === "teacher") {
          csvData.forEach((acc) => delete acc.class_name);
        }

        try {
          const endpoint =
            roleType === "student" ? "/register_student" : "/register_teacher";

          const res = await api.post(endpoint, csvData);

          const newAccounts: Account[] = res.data || [];

          setAccountList([...accountList, ...newAccounts]);

          alert("Thêm hàng loạt thành công!");
          e.target.value = ""; // reset file input
        } catch (err) {
          console.error(err);
          alert("Lỗi khi thêm hàng loạt!");
        }
      },
    });
  };

  // --- SỬA TRỰC TIẾP ---
  const handleEditClick = (index: number) => {
    setEditIndex(index);
    setEditData({ ...accountList[index] });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleSaveEdit = async () => {
    if (!editData.school_id) return;
    try {
      await api.post("/change_info", { [editData.school_id]: editData });
      const updatedList = [...accountList];
      updatedList[editIndex!] = editData as Account;
      setAccountList(updatedList);
      setEditIndex(null);
      alert("Cập nhật thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi cập nhật!");
    }
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditData({});
  };

  // --- XÓA ---
  const handleDelete = async (school_id: string) => {
    try {
      await api.post("/delete_info", [school_id]);
      alert("Xóa thành công!");
      setAccountList(accountList.filter((a) => a.school_id !== school_id));
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa!");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Quản lý tài khoản</h2>

      {/* --- CHỌN LOẠI TÀI KHOẢN --- */}
      <div className="mb-4">
        <label className="me-2">Loại tài khoản:</label>
        <select
          value={roleType}
          onChange={(e) => setRoleType(e.target.value as "student" | "teacher")}
          className="form-select w-auto d-inline-block"
        >
          <option value="student">Sinh viên</option>
          <option value="teacher">Giảng viên</option>
        </select>
      </div>

      {/* --- FORM THÊM MỚI --- */}
      <div className="border p-4 rounded mb-4">
        <h5 className="fw-semibold mb-3">
          Thêm {roleType === "student" ? "sinh viên" : "giảng viên"}
        </h5>

        <div className="row g-3">
          {/* Form 1 account */}
          <div className="col-md-6">
            <input
              name="name"
              placeholder="Họ tên"
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="col-md-6">
            <input
              name="personal_id"
              placeholder="Mã định danh"
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="col-md-6">
            <input
              name="phone_number"
              placeholder="Số điện thoại"
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="col-md-6">
            <input
              name="address"
              placeholder="Địa chỉ"
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="col-md-6">
            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="col-md-6">
            <input
              name="date_of_joining"
              type="date"
              onChange={handleChange}
              className="form-control"
            />
          </div>
          {roleType === "student" && (
            <div className="col-md-6">
              <select
                name="class_name"
                onChange={handleChange}
                className="form-select"
              >
                <option value="">--Chọn lớp--</option>
                {classList.map((cls, idx) => (
                  <option key={idx} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button onClick={handleAdd} className="btn btn-success mt-3">
          Thêm
        </button>
        {/* Upload CSV */}
        <div className="col-md-6">
          <label className="form-label">Upload CSV để thêm nhiều</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="form-control"
          />
        </div>
      </div>

      {/* --- BẢNG DANH SÁCH --- */}
      <table className="table table-bordered align-middle text-center">
        <thead className="table-light">
          <tr>
            <th>Mã</th>
            <th>Tên</th>
            <th>Email</th>
            <th>Điện thoại</th>
            <th>Lớp</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {accountList.map((acc, i) => (
            <tr key={i}>
              <td>{acc.school_id}</td>

              {editIndex === i ? (
                <>
                  <td>
                    <input
                      name="name"
                      value={editData.name || ""}
                      onChange={handleEditChange}
                      className="form-control"
                    />
                  </td>
                  <td>
                    <input
                      name="email"
                      value={editData.email || ""}
                      onChange={handleEditChange}
                      className="form-control"
                    />
                  </td>
                  <td>
                    <input
                      name="phone_number"
                      value={editData.phone_number || ""}
                      onChange={handleEditChange}
                      className="form-control"
                    />
                  </td>
                  <td>
                    {roleType === "student" ? (
                      <select
                        name="class_name"
                        value={editData.class_name || ""}
                        onChange={handleEditChange}
                        className="form-select"
                      >
                        {classList.map((cls, idx) => (
                          <option key={idx} value={cls}>
                            {cls}
                          </option>
                        ))}
                      </select>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <button
                      onClick={handleSaveEdit}
                      className="btn btn-success btn-sm me-2"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn btn-secondary btn-sm"
                    >
                      Hủy
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{acc.name}</td>
                  <td>{acc.email}</td>
                  <td>{acc.phone_number}</td>
                  <td>{acc.class_name || "-"}</td>
                  <td>
                    <button
                      onClick={() => handleEditClick(i)}
                      className="btn btn-warning btn-sm me-2"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(acc.school_id!)}
                      className="btn btn-danger btn-sm"
                    >
                      Xóa
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountManager;
