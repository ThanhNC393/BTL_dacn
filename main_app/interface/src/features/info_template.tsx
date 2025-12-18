import React, { useEffect, useState } from "react";
import { Card, Form, Button, Row, Col, Badge } from "react-bootstrap";
import api from "../apis";

interface Field {
  key: string;
  label: string;
  editable: boolean;
}

interface Props {
  data_: any;
  setUserInfo?: (data: any) => void;
}

const COMMON_FIELDS: Field[] = [
  { key: "name", label: "Tên", editable: true },
  { key: "email", label: "Email", editable: true },
  { key: "address", label: "Địa chỉ", editable: true },
  { key: "phone_number", label: "Số điện thoại", editable: true },
  { key: "personal_id", label: "Mã định danh", editable: true },
  { key: "date_of_joining", label: "Ngày gia nhập", editable: false },
];

const InfoEdit: React.FC<Props> = ({ data_, setUserInfo }) => {
  const isAdmin = Number(data_.role) === 2;
  const [formState, setFormState] = useState<any>({});
  useEffect(() => {
    const initial: any = {};

    COMMON_FIELDS.forEach((f) => {
      initial[f.key] = data_[f.key] ?? "";
    });

    if (Number(data_.role) === 1) {
      initial.class = data_.class;
      initial.school_id = data_.school_id;
    }

    if (Number(data_.role) === 0) {
      initial.school_id = data_.school_id;
    }

    setFormState(initial);
  }, [data_]);

  const handleChange = (key: string, value: string) => {
    setFormState((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      [data_.school_id]: {
        name: formState.name,
        email: formState.email,
        address: formState.address,
        phone_number: formState.phone_number,
        personal_id: formState.personal_id,
      },
    };

    const url = isAdmin ? "/change_info" : "/request_change_info";

    try {
      await api.post(url, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (isAdmin && typeof setUserInfo === "function") {
        /**
         * 🔑 ADMIN: cập nhật source of truth
         */
        setUserInfo((prev: any) => ({
          ...prev,
          ...payload[data_.school_id],
        }));
      }

      alert(isAdmin ? "Cập nhật thành công" : "Đã gửi yêu cầu chỉnh sửa");
    } catch (err) {
      console.error(err);
      alert("Thao tác thất bại");
    }
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">Chỉnh sửa thông tin</h4>
          <Badge bg={isAdmin ? "success" : "warning"}>
            {isAdmin ? "Admin – sửa trực tiếp" : "User – gửi yêu cầu"}
          </Badge>
        </div>

        <Row className="g-4">
          {COMMON_FIELDS.map((field) => (
            <Col md={6} lg={4} key={field.key}>
              <Form.Group>
                <Form.Label>{field.label}</Form.Label>
                <Form.Control
                  value={formState[field.key] || ""}
                  readOnly={!field.editable}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={!field.editable ? "bg-light" : ""}
                />
              </Form.Group>
            </Col>
          ))}

          {formState.school_id && (
            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label>Mã định danh nội bộ</Form.Label>
                <Form.Control
                  value={formState.school_id}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
            </Col>
          )}

          {formState.class && (
            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label>Lớp học</Form.Label>
                <Form.Control
                  value={formState.class}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
            </Col>
          )}
        </Row>

        <div className="d-flex justify-content-end mt-4">
          <Button
            size="lg"
            variant={isAdmin ? "success" : "primary"}
            onClick={handleSubmit}
          >
            {isAdmin ? "Lưu thay đổi" : "Gửi yêu cầu sửa thông tin"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default InfoEdit;
