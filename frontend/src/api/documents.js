import api from "./axios";

export const listDocuments = () =>
  api.get("/documents").then((r) => r.data);

export const getDocument = (id) =>
  api.get(`/documents/${id}`).then((r) => r.data);

export const uploadDocument = (
  file,
  { title, subject, onProgress } = {}
) => {
  const formData = new FormData();

  formData.append("file", file);

  if (title) formData.append("title", title);
  if (subject) formData.append("subject", subject);

  return api
    .post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    })
    .then((r) => r.data);
};

export const deleteDocument = (id) =>
  api.delete(`/documents/${id}`).then((r) => r.data);

export const testSearch = (q, documentId) =>
  api
    .get("/documents/search/test", {
      params: { q, documentId },
    })
    .then((r) => r.data);