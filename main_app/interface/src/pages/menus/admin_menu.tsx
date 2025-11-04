import { useState } from "react";

const menuItems = [
  "Tạo tài khoản",
  "Thông tin cá nhân",
  "Xem thông tin users",
  "Quản lý thông tin users",
  "Quản lý tài khoản users",
  "Quản lý thông tin lớp",
  "Quản lý học kỳ",
  "Quản lý môn học",
];

interface tmp {
  role_name: string;
}

function Admin_menu({ role_name }: tmp) {
  const [selectedButton, setSelectedButton] = useState(0);
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* BODY: SIDEBAR + MAIN */}
      <div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
        {/* SIDEBAR */}
        <aside
          className="bg-dark text-white p-3 d-flex flex-column"
          style={{ width: "280px", flexShrink: 0 }}
        >
          <h4 className="text-center mb-4">{role_name}</h4>
          <nav className="nav flex-column flex-grow-1">
            {menuItems.map((item, i) => {
              const isSelected = selectedButton === i;
              const isHovered = hoveredButton === i;

              return (
                <button
                  key={i}
                  className={`btn text-start mb-2 w-100 d-flex align-items-center ${
                    isSelected ? "btn-primary" : ""
                  }`}
                  onClick={() => setSelectedButton(i)}
                  onMouseEnter={() => setHoveredButton(i)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    borderRadius: "10px",
                    backgroundColor: !isSelected ? "transparent" : undefined, // giữ nền trong suốt nếu chưa chọn
                    color: isSelected ? "white" : isHovered ? "red" : "white", // hover chữ đen
                  }}
                >
                  <i className="bi bi-caret-right-fill me-2"></i>
                  {item}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-grow-1 p-4 overflow-auto bg-white">
          {/* <h2>{menuItems[selectedButton]}</h2>
          <p>Đây là nội dung của mục "{menuItems[selectedButton]}".</p> */}
        </main>
      </div>
      ;
    </div>
  );
}

export default Admin_menu;
