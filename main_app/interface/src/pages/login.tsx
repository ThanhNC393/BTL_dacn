import React, { useState, useEffect } from "react";
import { Button, Card, Alert, Form } from "react-bootstrap";
import api from "../apis";
import { useNavigate } from "react-router-dom";

interface LoginForm {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({ username: "", password: "" });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // 🧩 Kiểm tra token trước khi render
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return; // không có token → ở lại login

      try {
        const res = await api.get("/protected", {
          // headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.valid) {
          navigate("/home");
        }
      } catch (err) {
        console.log("Token hết hạn hoặc không hợp lệ, ở lại login");
      }
    };

    checkToken();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      setError("Không được để trống tên tài khoản hoặc mật khẩu!");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // ✅ Gọi API đăng nhập
      const response = await api.post("/user_login", form, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // ✅ Lưu token vào localStorage
      localStorage.setItem("access_token", response.data.token);
      localStorage.setItem("info", JSON.stringify(response.data.info));
      if (JSON.stringify(response.data.cir)) {
        localStorage.setItem("cir", response.data.cir);
        localStorage.setItem(
          "cir_info",
          JSON.stringify(response.data.cir_data)
        );
      }

      // ✅ Điều hướng đến trang home
      console.log(response.data.token);

      navigate("/home");
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data);
      } else {
        setError("Lỗi mạng hoặc server không phản hồi!");
      }
    } finally {
      setLoading(false);
    }
  };

  // const handleRegister = () => {
  //   alert("Chuyển sang trang Đăng ký...");
  // };

  const handleForgotPassword = () => {
    alert("Chuyển sang trang Quên mật khẩu...");
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <Card className="p-4 shadow-sm" style={{ width: "380px" }}>
        <Card.Body>
          <h3 className="text-center mb-4 text-primary">Đăng nhập</h3>

          <div className="mb-3">
            <Form.Label>Tên tài khoản</Form.Label>
            <Form.Control
              type="text"
              name="username"
              placeholder="Nhập tên tài khoản..."
              value={form.username}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <Form.Label>Mật khẩu</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Nhập mật khẩu..."
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {error && (
            <Alert variant="danger" className="text-center py-2">
              {error}
            </Alert>
          )}

          <Button
            variant="primary"
            className="w-100 mt-2"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <div className="d-flex justify-content-between mt-3">
            {/* <Button variant="link" className="p-0" onClick={handleRegister}>
              Đăng ký
            </Button> */}
            <Button
              variant="link"
              className="p-0 text-secondary"
              onClick={handleForgotPassword}
            >
              Quên mật khẩu?
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LoginPage;
