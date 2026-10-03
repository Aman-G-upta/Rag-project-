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
import WeakTopics from "./pages/WeakTopics";
import FlashcardList from "./pages/FlashcardList";
import FlashcardStudy from "./pages/FlashcardStudy";


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
          <Route path="/weak-topics" element={<ProtectedRoute><WeakTopics /></ProtectedRoute>} />
          <Route path="/quiz/:documentId" element={<ProtectedRoute><QuizList /></ProtectedRoute>} />
          <Route path="/quiz/take/:quizId" element={<ProtectedRoute><QuizAttempt /></ProtectedRoute>} />
          <Route path="/flashcards/:documentId" element={<ProtectedRoute><FlashcardList /></ProtectedRoute>} />
          <Route path="/flashcards/study/:setId" element={<ProtectedRoute><FlashcardStudy /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}