import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

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

  const fetchSchedule = async () => {
    if (!schoolId) return;
    try {
      const res = await fetch("http://127.0.0.1:5000/api/v1/get_tkb/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: schoolId }),
      });
      const data = await res.json();
      setSchedule(data || {});
    } catch (err) {
      console.error(err);
      setSchedule({});
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

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

  const renderTimetable = () => {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd(weekStart);

    const timetable: { [day: string]: { [period: number]: string[] } } = {};
    DAYS.forEach((d) => (timetable[d] = {}));

    Object.entries(schedule).forEach(([dateStr, subjects]) => {
      const date = new Date(dateStr + "T00:00:00");
      if (Number.isNaN(date.getTime())) return;
      if (date < weekStart || date > weekEnd) return;

      const weekday = date.getDay();
      const vnIndex = weekday === 0 ? 6 : weekday - 1;
      const dayName = DAYS[vnIndex];

      subjects.forEach((subjObj) => {
        Object.entries(subjObj).forEach(([subject, periods]) => {
          periods.forEach((p) => {
            if (!timetable[dayName][p]) timetable[dayName][p] = [];
            if (!timetable[dayName][p].includes(subject))
              timetable[dayName][p].push(subject);
          });
        });
      });
    });

    const maxPeriods = 10;

    return (
      <div>
        <div className="d-flex justify-content-between mb-2 align-items-center">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            ◀ Tuần trước
          </button>
          <div>
            <strong>
              Tuần {weekStart.toLocaleDateString()} -{" "}
              {getWeekEnd(weekStart).toLocaleDateString()}
            </strong>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            Tuần sau ▶
          </button>
        </div>

        <table className="table table-bordered mt-3 text-center">
          <thead>
            <tr>
              <th>Tiết</th>
              {DAYS.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxPeriods }, (_, i) => i + 1).map(
              (period) => (
                <tr key={period}>
                  <td>
                    <strong>{period}</strong>
                  </td>
                  {DAYS.map((day) => (
                    <td key={day + period} style={{ verticalAlign: "middle" }}>
                      {(timetable[day][period] || []).map((subj, idx) => (
                        <div key={idx}>{subj}</div>
                      ))}
                    </td>
                  ))}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Lịch học</h3>
      {Object.keys(schedule).length > 0 ? (
        renderTimetable()
      ) : (
        <p>Không có dữ liệu lịch.</p>
      )}
    </div>
  );
}
