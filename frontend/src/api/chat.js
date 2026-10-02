import api from "./axios";

export const askQuestion = (documentId, question, conversationId) =>
  api
    .post("/chat", { documentId, question, conversationId: conversationId || undefined })
    .then((r) => r.data);

export const listConversations = () => api.get("/chat").then((r) => r.data);

export const getConversationMessages = (id) =>
  api.get(`/chat/${id}`).then((r) => r.data);