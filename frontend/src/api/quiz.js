import api from "./axios";

export const generateQuiz = (documentId, numQuestions) =>
  api.post("/quiz/generate", { documentId, numQuestions }).then((r) => r.data);

export const listQuizzes = (documentId) =>
  api.get("/quiz", { params: { documentId } }).then((r) => r.data);

export const getQuiz = (id) => api.get(`/quiz/${id}`).then((r) => r.data);

export const submitQuiz = (id, answers) =>
  api.post(`/quiz/${id}/submit`, { answers }).then((r) => r.data);

export const getWeakTopics = () => api.get("/quiz/weak-topics").then((r) => r.data);

export const getQuizHistory = () => api.get("/quiz/history").then((r) => r.data);