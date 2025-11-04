// import { useState } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/login";
import HomePage from "./pages/homepage";
// function App() {
//   const [count, setCount] = useState(0);

//   return <LoginPage />;
// }

//   const handleLogout = () => {
//     localStorage.removeItem("access_token");
//     localStorage.removeItem("name");
//     navigate("/login");
//   };

const App: React.FC = () => {
  const token = localStorage.getItem("access_token");

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/home"
          element={token ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
