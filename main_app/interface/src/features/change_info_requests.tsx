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

interface tmp {
  data: any;
  setNum: any;
}

const App: React.FC<tmp> = ({ data, setNum }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [refresh, makeRefresh] = useState<number>(0);
  // Lấy dữ liệu từ API khi component mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.post(
          "/get_request_change_info",
          data.role === 2 ? [] : [data.school_id],
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        setNum(localStorage.setItem("cir", response.data.length));
        setNum(localStorage.getItem("cir"));
        setItems(response.data); // giả sử API trả về array
      } catch (error) {
        console.error("Lỗi khi fetch data:", error);
      }
    };

    fetchItems();
  }, [refresh]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleCheckbox = (id: string) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ✅ HÀM MỚI THÊM: Gửi danh sách ID được chọn lên API
  const handleSubmit = async () => {
    if (checkedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một yêu cầu trước khi gửi!");
      return;
    }
    try {
      const response = await api.post("/approve_change_request", checkedItems, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Phản hồi từ API:", response.data);
      localStorage.setItem(
        "cir",
        String(Number(localStorage.getItem("cir")) - checkedItems.length)
      );
      setNum(localStorage.getItem("cir"));
      makeRefresh(refresh + 1);
      alert("Gửi yêu cầu thành công!");
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu:", error);
      alert("Gửi yêu cầu thất bại!");
    }
  };

  const handleSubmit2 = async () => {
    if (checkedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một yêu cầu trước khi gửi!");
      return;
    }
    try {
      const response = await api.post("/reject_change_request", checkedItems, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Phản hồi từ API:", response.data);
      makeRefresh(refresh + 1);
      alert("Gửi yêu cầu thành công!");
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu:", error);
      alert("Gửi yêu cầu thất bại!");
    }
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
              <h4 className="text-muted">Yêu cầu sửa thông tin </h4>
            </div>
            <input
              type="checkbox"
              checked={checkedItems.includes(item.school_id)}
              onChange={() => toggleCheckbox(item.school_id)}
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

      {/* ✅ NÚT MỚI THÊM Ở DƯỚI CÙNG */}
      {data.role === 2 ? (
        <div className="text-center mt-4">
          <button className="btn btn-primary me-2" onClick={handleSubmit}>
            Chấp nhận yêu cầu
          </button>
          <button className="btn btn-secondary" onClick={handleSubmit2}>
            Hủy yêu cầu
          </button>
        </div>
      ) : (
        <div className="text-center mt-4">
          <button className="btn btn-secondary" onClick={handleSubmit2}>
            Hủy yêu cầu
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
