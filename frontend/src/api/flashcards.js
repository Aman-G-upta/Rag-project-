import api from "./axios";

export const generateFlashcards = (documentId, numCards) =>
  api.post("/flashcards/generate", { documentId, numCards }).then((r) => r.data);

export const listFlashcardSets = (documentId) =>
  api.get("/flashcards", { params: { documentId } }).then((r) => r.data);

export const getFlashcardSet = (id) => api.get(`/flashcards/${id}`).then((r) => r.data);

export const deleteFlashcardSet = (id) => api.delete(`/flashcards/${id}`).then((r) => r.data);