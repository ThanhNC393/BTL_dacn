import React, { useEffect, useState } from "react";
import api from "../apis"; // axios instance

type RoleType = "student" | "teacher";

interface UserItem {
  school_id: string;
  name: string;
  personal_id?: string;
  phone_number?: string;
  address?: string;
  date_of_joining?: string;
  email?: string;
  class_name?: string; // students will have this, teachers may not
}

interface ExistingAccount {
  user_id: string;
}

const AccountUserManager: React.FC = () => {
  const [roleType, setRoleType] = useState<RoleType>("student");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [existingAccounts, setExistingAccounts] = useState<Set<string>>(
    new Set()
  );
  const [selectedUser, setSelectedUser] = useState<string>("");

  // edit fields for account (account_name / pass_word)
  const [editTarget, setEditTarget] = useState<string | null>(null); // user_id
  const [editData, setEditData] = useState<{
    account_name?: string;
    pass_word?: string;
  }>({});

  // --- Fetch users (students or teachers) ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const url = roleType === "student" ? "/get_students" : "/get_teachers";
        const res = await api.post(url, {});
        let data = res.data || {};

        const list: UserItem[] = Object.entries(data).map(
          ([id, info]: any) => ({
            school_id: id,
            ...(info || {}),
          })
        );

        setUsers(list);
        setSelectedUser("");
      } catch (err) {
        console.error("fetchUsers error", err);
        setUsers([]);
      }
    };
    fetchUsers();
  }, [roleType]);

  // --- Fetch existing accounts (only user_ids) ---
  useEffect(() => {
    const fetchExistingAccounts = async () => {
      try {
        const res = await api.post("/get_account", []);
        const list: ExistingAccount[] = Array.isArray(res.data) ? res.data : [];
        setExistingAccounts(new Set(list.map((it) => it.user_id)));
        console.log(existingAccounts);
      } catch (err) {
        console.error("fetchExistingAccounts error", err);
        setExistingAccounts(new Set());
      }
    };
    fetchExistingAccounts();
  }, []);

  // --- Add single account ---
  const handleAddAccount = async () => {
    if (!selectedUser) return alert("Vui lòng chọn một user để tạo tài khoản");
    if (existingAccounts.has(selectedUser))
      return alert("Tài khoản đã tồn tại");

    try {
      const url = "/add_account";
      const payload = [selectedUser];
      await api.post(url, payload);
      setExistingAccounts((prev) => new Set(prev).add(selectedUser));
      alert("Tạo tài khoản thành công!");
    } catch (err) {
      console.error("handleAddAccount error", err);
      alert("Lỗi khi tạo tài khoản");
    }
  };

  // --- Delete accounts ---
  const [deleteSelection, setDeleteSelection] = useState<Set<string>>(
    new Set()
  );
  const toggleDeleteSelection = (id: string) => {
    setDeleteSelection((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };
  const handleDeleteAccounts = async () => {
    if (deleteSelection.size === 0) return alert("Chưa chọn tài khoản để xóa");
    const toDelete = Array.from(deleteSelection).filter((id) =>
      existingAccounts.has(id)
    );
    if (toDelete.length === 0) return alert("Không có tài khoản hợp lệ để xóa");

    try {
      const url = "/delete_account";
      await api.post(url, toDelete);
      setExistingAccounts((prev) => {
        const s = new Set(prev);
        toDelete.forEach((id) => s.delete(id));
        return s;
      });
      setDeleteSelection(new Set());
      alert("Xóa thành công");
    } catch (err) {
      console.error("handleDeleteAccounts error", err);
      alert("Lỗi khi xóa tài khoản");
    }
  };

  // --- Edit account credentials ---
  const startEdit = (user_id: string) => {
    setEditTarget(user_id);
    setEditData({ account_name: "", pass_word: "" });
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };
  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (!editData.account_name && !editData.pass_word)
      return alert("Vui lòng nhập account_name hoặc pass_word để sửa");
    if (!existingAccounts.has(editTarget))
      return alert("Tài khoản không tồn tại");

    try {
      const url = "/edit_account";
      const payload: any = {};
      payload[editTarget] = {};
      if (editData.account_name)
        payload[editTarget].account_name = editData.account_name;
      if (editData.pass_word)
        payload[editTarget].pass_word = editData.pass_word;
      await api.post(url, payload);
      setEditTarget(null);
      setEditData({});
      alert("Cập nhật tài khoản thành công");
    } catch (err) {
      console.error("handleSaveEdit error", err);
      alert("Lỗi khi cập nhật tài khoản");
    }
  };

  // --- CSV Upload ---
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  // --- CSV Upload ---
  const handleUploadCSV = async () => {
    if (!csvFile) return alert("Vui lòng chọn file CSV trước");

    try {
      const text = await csvFile.text();
      const rows = text.split(/\r?\n/).filter((r) => r.trim() !== "");
      if (rows.length < 2)
        return alert("CSV phải có header và ít nhất 1 dòng dữ liệu");

      const header = rows[0].split(",").map((h) => h.trim());
      const idxSchoolId = header.indexOf("school_id");
      if (idxSchoolId === -1) return alert("CSV phải có cột 'school_id'");

      // chỉ lấy school_id hợp lệ
      const schoolIds: string[] = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",").map((c) => c.trim());
        const school_id = cols[idxSchoolId];
        if (!school_id) continue; // bỏ qua dòng trống
        if (existingAccounts.has(school_id)) continue; // bỏ qua user đã có account
        schoolIds.push(school_id);
      }

      if (schoolIds.length === 0)
        return alert("Không có user hợp lệ để tạo tài khoản");

      // gửi JSON đơn giản chỉ chứa mảng school_id
      await api.post("/add_account", schoolIds);

      alert("Thêm tài khoản hàng loạt thành công!");
      setCsvFile(null);

      // refresh list of existing accounts
      const res = await api.post("/get_account", []);
      const list: ExistingAccount[] = Array.isArray(res.data) ? res.data : [];
      setExistingAccounts(new Set(list.map((it) => it.user_id)));
    } catch (err) {
      console.error("handleUploadCSV error", err);
      alert("Lỗi khi tải CSV, vui lòng kiểm tra định dạng file!");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Quản lý tài khoản người dùng</h2>

      {/* --- Role selector --- */}
      <div className="mb-3 d-flex align-items-center gap-3">
        <label className="me-2 mb-0">Chọn loại user:</label>
        <select
          className="form-select w-auto"
          value={roleType}
          onChange={(e) => setRoleType(e.target.value as RoleType)}
        >
          <option value="student">Sinh viên</option>
          <option value="teacher">Giảng viên</option>
        </select>
      </div>

      {/* --- Add single account --- */}
      <div className="border p-3 rounded mb-4">
        <h5>Thêm tài khoản cho user</h5>
        <div className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="form-label">Chọn user</label>
            <select
              className="form-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">-- Chọn 1 user --</option>
              {users
                .filter((u) => !existingAccounts.has(u.school_id)) // chỉ lấy user chưa có account
                .map((u) => (
                  <option key={u.school_id} value={u.school_id}>
                    {u.school_id} - {u.name}{" "}
                    {u.class_name ? `(${u.class_name})` : ""}
                  </option>
                ))}
            </select>
          </div>

          <div className="col-md-3">
            <button
              className="btn btn-success"
              onClick={handleAddAccount}
              disabled={!selectedUser}
            >
              Tạo tài khoản
            </button>
          </div>
        </div>

        {/* --- CSV Upload --- */}
        <div className="row g-2 align-items-end mt-4">
          <div className="col-md-6">
            <label className="form-label">
              Thêm hàng loạt bằng CSV (cột: school_id, name, email, ...)
            </label>
            <input
              type="file"
              className="form-control"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>
          <div className="col-md-3">
            <button
              className="btn btn-primary"
              onClick={handleUploadCSV}
              disabled={!csvFile}
            >
              Tải CSV lên
            </button>
          </div>
        </div>
      </div>

      {/* --- Existing accounts --- */}
      <div className="border p-3 rounded mb-4">
        <h5>Tài khoản hiện có</h5>
        <div className="mb-2">
          <button
            className="btn btn-danger btn-sm me-2"
            onClick={handleDeleteAccounts}
          >
            Xóa các tài khoản đã chọn
          </button>
        </div>

        <table className="table table-sm table-bordered">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>User ID</th>
              <th>Họ tên</th>
              <th>Loại</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(users).map((u) => {
              const hasAccount = existingAccounts.has(u.school_id);
              return (
                <tr key={u.school_id}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={deleteSelection.has(u.school_id)}
                      disabled={!hasAccount}
                      onChange={() => toggleDeleteSelection(u.school_id)}
                    />
                  </td>
                  <td>{u.school_id}</td>
                  <td>{u.name}</td>
                  <td>{roleType === "student" ? "Sinh viên" : "Giảng viên"}</td>
                  <td>
                    {hasAccount ? (
                      <>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => startEdit(u.school_id)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            const ok = window.confirm(
                              `Xóa tài khoản ${u.school_id}?`
                            );
                            if (!ok) return;
                            try {
                              await api.post("/delete_account", [u.school_id]);
                              setExistingAccounts((prev) => {
                                const s = new Set(prev);
                                s.delete(u.school_id);
                                return s;
                              });
                              alert("Xóa thành công");
                            } catch (err) {
                              console.error(err);
                              alert("Lỗi khi xóa");
                            }
                          }}
                        >
                          Xóa
                        </button>
                      </>
                    ) : (
                      <span className="text-muted">Chưa có tài khoản</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* --- Edit area --- */}
        {editTarget && (
          <div className="mt-3">
            <h6>Sửa tài khoản: {editTarget}</h6>
            <div className="row g-2">
              <div className="col-md-4">
                <input
                  name="account_name"
                  value={editData.account_name || ""}
                  onChange={handleEditChange}
                  className="form-control"
                  placeholder="account_name"
                />
              </div>
              <div className="col-md-4">
                <input
                  name="pass_word"
                  value={editData.pass_word || ""}
                  onChange={handleEditChange}
                  className="form-control"
                  placeholder="pass_word"
                />
              </div>
              <div className="col-md-4">
                <button
                  className="btn btn-primary me-2"
                  onClick={handleSaveEdit}
                >
                  Lưu
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditTarget(null);
                    setEditData({});
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountUserManager;
