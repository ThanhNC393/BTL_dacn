import { useState } from "react";
import RowList from "../../features/change_info_requests";
import Info from "../../features/info_template";
import SubjectManager from "../../features/manage_subject";
import SemesterManager from "../../features/manage_semester";
import ClassManager from "../../features/manage_class";
import AccountManager from "../../features/manage_info";
import AccountUserManager from "../../features/manage_account";
import StudentTeacherLookup from "../../features/manage_tkb";

interface tmp {
  role_name: string;
  menuItems: string[];
  role: number;
}

function Menu_template({ role_name, menuItems, role }: tmp) {
  let [badgeCount, setBadgeCount] = useState(Number);

  let dataStr = localStorage.getItem("info");
  let data_;
  if (dataStr) {
    data_ = JSON.parse(dataStr); // parse từ string -> object
  } else {
    data_ = null;
  }
  let pages_: any[];

  switch (role) {
    case 0: {
      pages_ = [
        <Info data_={data_} setNum={setBadgeCount} />,
        <RowList data={data_} setNum={setBadgeCount} />,
        2,
        3,
        4,
      ];
      break;
    }
    case 1: {
      pages_ = [
        <Info data_={data_} setNum={setBadgeCount} />,
        <RowList data={data_} setNum={setBadgeCount} />,
        2,
        3,
        4,
      ];
      break;
    }
    default: {
      pages_ = [
        <Info data_={data_} setNum={setBadgeCount} />,
        <RowList data={data_} setNum={setBadgeCount} />,
        <StudentTeacherLookup />,
        <AccountUserManager />,
        <AccountManager />,
        <ClassManager />,
        <SemesterManager />,
        <SubjectManager />,
      ];
    }
  }

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
              setBadgeCount(Number(localStorage.getItem("cir"))); // số hiển thị
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

export default Menu_template;
