import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useNavigate } from "react-router-dom";
import User_menu from "./menus/user_menu";
import Admin_menu from "./menus/admin_menu";
import Teacher_menu from "./menus/teacher_menu";
import logo from "../assets/unnamed.png";

const App: React.FC = () => {
  // const [selectedButton, setSelectedButton] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  let dataStr = localStorage.getItem("info");
  let data;
  if (dataStr) {
    data = JSON.parse(dataStr); // parse từ string -> object
  } else {
    data = null;
  }
  console.log(data.role);

  const role = data.role;
  let role_name;
  let menu;
  if (Number(role) === 0) {
    role_name = "Giảng viên";
    menu = <Teacher_menu role_name={role_name} />;
  } else if (Number(role) === 1) {
    role_name = "Sinh viên";
    menu = <User_menu role_name={role_name} />;
  } else {
    role_name = "Quản trị viên";
    menu = <Admin_menu role_name={role_name} />;
  }
  // const menuItems = [
  //   "Dashboard",
  //   "Quản lý sản phẩm",
  //   "Đơn hàng",
  //   "Khách hàng",
  //   "Thống kê",
  //   "Cài đặt",
  //   "Hỗ trợ",
  // ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    // localStorage.removeItem("name");
    localStorage.removeItem("info");

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
