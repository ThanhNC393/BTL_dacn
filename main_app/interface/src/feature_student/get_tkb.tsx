import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../apis";

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

interface Schedule {
  [date: string]: Array<{ [subject: string]: number[] }>;
}

export default function StudentSchedule() {
  const [schedule, setSchedule] = useState<Schedule>({});
  const [weekOffset, setWeekOffset] = useState(0);

  const schoolId = (() => {
    try {
      const info = JSON.parse(localStorage.getItem("info") || "{}");
      return info.school_id || "";
    } catch {
      return "";
    }
  })();

  // ================= FETCH =================
  const fetchSchedule = async () => {
    if (!schoolId) return;
    try {
      const res = await api.post("/get_tkb/student", {
        id: schoolId,
      });
      setSchedule(res.data || {});
    } catch (err) {
      console.error("Fetch schedule error:", err);
      setSchedule({});
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // ================= DATE UTILS =================
  const getWeekStart = (): Date => {
    const now = new Date();
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekEnd = (start: Date): Date => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  // ================= RENDER =================
  const renderTimetable = () => {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd(weekStart);

    const timetable: { [day: string]: { [period: number]: string[] } } = {};
    DAYS.forEach((d) => (timetable[d] = {}));

    Object.entries(schedule).forEach(([dateStr, subjects]) => {
      const date = new Date(dateStr + "T00:00:00");
      if (isNaN(date.getTime())) return;
      if (date < weekStart || date > weekEnd) return;

      const weekday = date.getDay();
      const vnIndex = weekday === 0 ? 6 : weekday - 1;
      const dayName = DAYS[vnIndex];

      subjects.forEach((subjObj) => {
        Object.entries(subjObj).forEach(([subject, periods]) => {
          periods.forEach((p) => {
            if (!timetable[dayName][p]) timetable[dayName][p] = [];
            if (!timetable[dayName][p].includes(subject)) {
              timetable[dayName][p].push(subject);
            }
          });
        });
      });
    });

    const maxPeriods = 20;

    return (
      <>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            ◀ Tuần trước
          </button>

          <strong>
            Tuần {weekStart.toLocaleDateString()} –{" "}
            {weekEnd.toLocaleDateString()}
          </strong>

          <button
            className="btn btn-outline-secondary"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            Tuần sau ▶
          </button>
        </div>

        <table className="table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: 80 }}>Tiết</th>
              {DAYS.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: maxPeriods }, (_, i) => i + 1).map(
              (period) => (
                <tr key={`period-${period}`}>
                  <td>
                    <strong>{period}</strong>
                  </td>

                  {DAYS.map((day) => (
                    <td key={`${day}-${period}`}>
                      {(timetable[day][period] || []).map((subj) => (
                        <div
                          key={`${day}-${period}-${subj}`}
                          className="fw-semibold"
                        >
                          {subj}
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>
              )
            )}
          </tbody>
        </table>
      </>
    );
  };

  // ================= MAIN =================
  return (
    <div className="container mt-4">
      <h3 className="mb-3">Lịch học</h3>
      {Object.keys(schedule).length > 0 ? (
        renderTimetable()
      ) : (
        <p className="text-muted">Không có dữ liệu lịch.</p>
      )}
    </div>
  );
}
