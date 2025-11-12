import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col } from "react-bootstrap";
import api from "../apis";

interface InfoData {
  title: string;
  value: string;
  editable: boolean;
}

interface tmpp {
  data_: any;
  setNum: any;
}

const Info: React.FC<tmpp> = ({ data_, setNum }) => {
  // Khởi tạo dữ liệu 8 ô: 4 editable, 4 read-only
  const [data, setData] = useState<InfoData[]>([
    { title: "Tên", value: data_.name, editable: true },
    { title: "Email", value: data_.email, editable: true },
    { title: "Địa chỉ", value: data_.address, editable: true },
    { title: "Số điện thoại", value: data_.phone_number, editable: true },
    { title: "Mã định danh", value: data_.personal_id, editable: true },
    { title: "Ngày gia nhập", value: data_.date_of_joining, editable: false },
  ]);

  useEffect(() => {
    // tránh việc thêm lặp lại khi data_ không đổi
    if (!data_?.role) return;

    if (Number(data_.role) === 1) {
      setData([
        ...data,
        { title: "Lớp học", value: data_.class, editable: false },
        { title: "Mã sinh viên", value: data_.school_id, editable: false },
      ]);
    } else if (Number(data_.role) === 0) {
      setData([
        ...data,
        { title: "Mã giảng viên", value: data_.school_id, editable: false },
      ]);
    }
  }, [data_]);

  const handleChange = (index: number, newValue: string) => {
    const newData = [...data];
    newData[index].value = newValue;
    setData(newData);
  };

  const handleSubmit = async () => {
    let tmp = data_.school_id;
    const payload = {
      [tmp]: {
        name: data[0].value,
        email: data[1].value,
        address: data[2].value,
        phone_number: data[3].value,
        personal_id: data[4].value,
      },
    };

    console.log("Payload gửi API:", payload);
    let response;
    let urll = data_.role === 2 ? "/change_info" : "/request_change_info";
    try {
      response = await api.post(urll, payload, {
        headers: { "Content-Type": "application/json" },
      });
      if (data_.role != 2) {
        setData((prev) =>
          prev.map((item) => {
            switch (item.title) {
              case "Tên":
                return { ...item, value: data_.name };
              case "Email":
                return { ...item, value: data_.email };
              case "Địa chỉ":
                return { ...item, value: data_.address };
              case "Số điện thoại":
                return { ...item, value: data_.phone_number };
              case "Mã định danh":
                return { ...item, value: data_.personal_id };
              default:
                return item;
            }
          })
        );
        localStorage.setItem("cir", "1");
        setNum(localStorage.getItem("cir"));
      }
      alert("Gửi thành công: " + JSON.stringify(response.data));
    } catch (err: any) {
      console.error(err);
      if (response) {
        alert("Gửi thất bại");
      }
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Thông tin chi tiết</h3>
      <Row className="g-3">
        {data.map((item, index) => (
          <Col md={3} key={index}>
            <Card className="p-2">
              <Form.Group>
                <Form.Label>{item.title}</Form.Label>
                <Form.Control
                  type="text"
                  value={item.value}
                  readOnly={!item.editable}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder={item.editable ? "Nhập thông tin..." : ""}
                />
              </Form.Group>
            </Card>
          </Col>
        ))}
      </Row>

      <Button className="mt-4" variant="success" onClick={handleSubmit}>
        {data_.role === 2 ? "Sửa thông tin" : "Yêu cầu sửa thông tin"}
      </Button>
    </div>
  );
};

export default Info;
