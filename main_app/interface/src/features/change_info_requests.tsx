import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

interface Item {
  name: string;
  personal_id: string;
  phone_number: string;
  address: string;
  email: string;
  school_id: string;
  id: number;
}

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // Lấy dữ liệu từ API khi component mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.post(
          "/get_request_change_info",
          ["2020GV11"],
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        setItems(response.data); // giả sử API trả về array
      } catch (error) {
        console.error("Lỗi khi fetch data:", error);
      }
    };

    fetchItems();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleCheckbox = (id: number) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="container mt-3">
      {items.map((item) => (
        <div key={item.school_id} className="mb-2 border rounded p-2">
          <div
            className="d-flex justify-content-between align-items-start"
            style={{ cursor: "pointer" }}
            onClick={() => toggleExpand(item.id)}
          >
            <div>
              <h4>{item.school_id}</h4>
              <h4 className="text-muted">{item.name}</h4>
            </div>
            <input
              type="checkbox"
              checked={checkedItems.includes(item.id)}
              onChange={() => toggleCheckbox(item.id)}
              onClick={(e) => e.stopPropagation()} // tránh click mở dropdown
            />
          </div>
          {expandedId === item.id && (
            <div className="mt-2 border-top pt-2 text-muted">
              <h5>Name: {item.name}</h5>
              <h5>personal_id: {item.personal_id}</h5>
              <h5>phone_number: {item.phone_number}</h5>
              <h5>address: {item.address}</h5>
              <h5>email: {item.email}</h5>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default App;
