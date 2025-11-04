import React, { useState } from "react";
import { Card, Form, Button, Row, Col } from "react-bootstrap";
import axios from "axios";
import api from "../apis";

interface InfoData {
  title: string;
  value: string;
  editable: boolean;
}

interface tmpp {
  data_: any;
}

// let dataStr = localStorage.getItem("info");
// let data_;
// if (dataStr) {
//   data_ = JSON.parse(dataStr); // parse từ string -> object
// } else {
//   data_ = null;
// }

// console.log(data_.name);

const MainPage: React.FC<tmpp> = ({ data_ }) => {
  // Khởi tạo dữ liệu 8 ô: 4 editable, 4 read-only
  const [data, setData] = useState<InfoData[]>([
    { title: "Tên", value: data_.name, editable: true },
    { title: "Email", value: data_.email, editable: true },
    { title: "Địa chỉ", value: data_.address, editable: true },
    { title: "Số điện thoại", value: data_.phone_number, editable: true },
    { title: "Mã định danh", value: data_.personal_id, editable: true },
    { title: "Ngày gia nhập", value: data_.date_of_joining, editable: false },
    { title: "Mã giảng viên", value: data_.school_id, editable: false },
    // { title: "Vai trò", value: "Admin", editable: false },
  ]);

  const handleChange = (index: number, newValue: string) => {
    const newData = [...data];
    newData[index].value = newValue;
    setData(newData);
  };

  const handleSubmit = async () => {
    // Gom dữ liệu
    // const payload = data.reduce((acc, item) => {
    //   acc[item.title] = item.value;
    //   return acc;
    // }, {} as Record<string, string>);
    let tmp = data_.school_id;
    const payload = {
      [tmp]: {
        name: data[0].value,
        email: data[1].value,
        address: data[2].value,
        phone_number: data[3].value,
        personal_id: data[4].value,
        date_of_joining: data[5].value,
        school_id: data[6].value,
      },
    };

    console.log("Payload gửi API:", payload);

    try {
      const response = await api.post("/request_change_info", payload, {
        headers: { "Content-Type": "application/json" },
      });
      setData([
        { title: "Tên", value: data_.name, editable: true },
        { title: "Email", value: data_.email, editable: true },
        { title: "Địa chỉ", value: data_.address, editable: true },
        { title: "Số điện thoại", value: data_.phone_number, editable: true },
        { title: "Mã định danh", value: data_.personal_id, editable: true },
        {
          title: "Ngày gia nhập",
          value: data_.date_of_joining,
          editable: false,
        },
        { title: "Mã giảng viên", value: data_.school_id, editable: false },
        // { title: "Vai trò", value: "Admin", editable: false },
      ]);
      alert("Gửi thành công: " + JSON.stringify(response.data));
    } catch (err: any) {
      console.error(err);
      alert("Gửi thất bại!");
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
        Yêu cầu sửa thông tin
      </Button>
    </div>
  );
};

export default MainPage;
