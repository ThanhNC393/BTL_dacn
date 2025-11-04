import { useState } from "react";
import MainPage from "../../features/change_info";
import RowList from "../../features/change_info_requests";

const menuItems = [
  "Thông tin cá nhân",
  "Yêu cầu sửa thông tin",
  "Xem thông tin sinh viên",
  "Xem lịch giảng dạy",
  "Quản lý môn dạy",
];

interface tmp {
  role_name: string;
}

function Teacher_menu({ role_name }: tmp) {
  let dataStr = localStorage.getItem("info");
  let data_;
  if (dataStr) {
    data_ = JSON.parse(dataStr); // parse từ string -> object
  } else {
    data_ = null;
  }
  let pages_: any[] = [<MainPage data_={data_} />, <RowList />];

  const [selectedButton, setSelectedButton] = useState(0);
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);
  let selectedPage = pages_[selectedButton];

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

              // Giả sử button thứ 2 có badge
              const showBadge = i === 1;
              const badgeCount = Number(data_.cir); // số hiển thị

              return (
                <button
                  key={i}
                  className={`btn text-start mb-2 w-100 d-flex align-items-center justify-content-between ${
                    isSelected ? "btn-primary" : ""
                  }`}
                  onClick={() => setSelectedButton(i)}
                  onMouseEnter={() => setHoveredButton(i)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    borderRadius: "10px",
                    backgroundColor: !isSelected ? "transparent" : undefined,
                    color: isSelected ? "white" : isHovered ? "red" : "white",
                    position: "relative", // để badge có thể absolute nếu muốn
                  }}
                >
                  <span className="d-flex align-items-center">
                    <i className="bi bi-caret-right-fill me-2"></i>
                    {item}
                  </span>

                  {showBadge && (
                    <span
                      style={{
                        backgroundColor: "red",
                        color: "white",
                        borderRadius: "50%",
                        padding: "2px 6px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-grow-1 p-4 overflow-auto bg-white">
          {selectedPage}
        </main>
      </div>
      ;
    </div>
  );
}

export default Teacher_menu;
