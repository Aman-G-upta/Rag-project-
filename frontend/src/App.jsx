import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import QuizList from "./pages/QuizList";
import QuizAttempt from "./pages/QuizAttempt";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat/:documentId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/quiz/:documentId" element={<ProtectedRoute><QuizList /></ProtectedRoute>} />
          <Route path="/quiz/take/:quizId" element={<ProtectedRoute><QuizAttempt /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}