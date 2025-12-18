import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

type AnnouncementItem = [string, string]; // [subject, content]

interface AnnouncementResponse {
  [date: string]: AnnouncementItem[];
}

const StudentAnnouncements: React.FC = () => {
  const [data, setData] = useState<AnnouncementResponse>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const infoStr = localStorage.getItem("info");
        if (!infoStr) return;

        const info = JSON.parse(infoStr);

        const res = await api.post("/get_announcs", [
          info.school_id, // đúng theo API của bạn
        ]);

        setData(res.data || {});
      } catch (err) {
        console.error("Lỗi lấy thông báo:", err);
        setData({});
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return <div className="text-center mt-4">Đang tải thông báo...</div>;
  }

  return (
    <div className="container mt-3">
      <h4 className="mb-4 text-danger">
        <i className="bi bi-bell-fill me-2"></i>
        Thông báo của sinh viên
      </h4>

      {Object.keys(data).length === 0 && (
        <div className="alert alert-secondary">Không có thông báo nào.</div>
      )}

      {Object.entries(data)
        .sort(([a], [b]) => (a < b ? 1 : -1)) // ngày mới lên trên
        .map(([date, announcements]) => (
          <div key={date} className="mb-4">
            {/* Ngày */}
            <div className="fw-bold mb-2 text-primary">
              📅 {new Date(date).toLocaleDateString("vi-VN")}
            </div>

            {/* Danh sách thông báo */}
            {announcements.map(([subject, content], idx) => (
              <div key={`${date}-${idx}`} className="card mb-2 shadow-sm">
                <div className="card-body">
                  <h6 className="card-title text-success">📘 {subject}</h6>
                  <p className="card-text">{content}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
};

export default StudentAnnouncements;
