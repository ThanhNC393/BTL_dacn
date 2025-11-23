import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/unnamed.png";
import Menu_template from "./menu_template";
import api from "../apis";

const App: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Token hết hạn hoặc không hợp lệ, ở lại login");
        navigate("/login"); // không có token
        return;
      }

      try {
        const res = await api.get("/protected", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.valid) {
          return;
        }
      } catch (err) {
        alert("Token hết hạn hoặc không hợp lệ, ở lại login");
        navigate("/login");
      }
    };

    checkToken();
  }, [navigate]);

  const [showMenu, setShowMenu] = useState(false);
  // const navigate = useNavigate();

  let dataStr = localStorage.getItem("info");
  let data;
  if (dataStr) {
    data = JSON.parse(dataStr); // parse từ string -> object
  } else {
    data = null;
  }

  const role = data.role;
  let role_name;
  let menu;

  if (Number(role) === 0) {
    role_name = "Giảng viên";
    menu = (
      <Menu_template
        role_name={role_name}
        menuItems={[
          "Thông tin cá nhân",
          "Yêu cầu sửa thông tin",
          "Tra cứu thông tin",
          "Xem lịch giảng dạy",
          "Quản lý môn dạy",
          "Điểm danh môn học",
        ]}
        role={0}
      />
    );
  } else if (Number(role) === 1) {
    role_name = "Sinh viên";
    menu = (
      <Menu_template
        role_name={role_name}
        menuItems={[
          "Thông tin cá nhân",
          "Yêu cầu sửa thông tin",
          "Xem thời khóa biểu",
          "Kết quả học tập",
          "Đăng ký học phần",
        ]}
        role={1}
      />
    );
  } else {
    role_name = "Quản trị viên";
    menu = (
      <Menu_template
        role_name={role_name}
        menuItems={[
          "Thông tin cá nhân",
          "Yêu cầu sửa thông tin",
          "Tra cứu thông tin users",
          "Quản lý tài khoản user",
          "Quản lý thông tin users",
          "Quản lý thông tin lớp",
          "Quản lý học kỳ",
          "Quản lý môn học",
        ]}
        role={2}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("info");
    localStorage.removeItem("cir");
    localStorage.removeItem("cir_info");

    navigate("/login");
  };

  return (
    <div className="vh-100 d-flex flex-column">
      {/* HEADER */}
      <header
        className="d-flex justify-content-between align-items-center bg-secondary px-4 py-2 shadow-sm"
        style={{ height: "64px", flexShrink: 0 }}
      >
        <div className="fw-bold fs-5 d-flex align-items-center">
          <img
            src={logo}
            alt="Logo"
            className="me-2 rounded"
            style={{ width: "40px", height: "40px" }} // tuỳ chỉnh kích thước
          />

          <span className="text-white">Khoa công nghệ thông tin - HAUI</span>
        </div>

        <div className="position-relative">
          <button
            className="btn btn-light d-flex align-items-center"
            onClick={() => setShowMenu(!showMenu)}
          >
            <i className="bi bi-person-circle me-2"></i>
            Xin chào: {data.name}
          </button>

          {showMenu && (
            <div
              className="dropdown-menu dropdown-menu-end show mt-2"
              style={{ right: 0 }}
            >
              <button className="dropdown-item" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>
      {menu}
    </div>
  );
};

export default App;
