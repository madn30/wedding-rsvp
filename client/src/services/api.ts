import axios from "axios";
import toast from "react-hot-toast";
import { localAdapter } from "./localBackend";

const api = axios.create({
  adapter: localAdapter,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "שגיאה בלתי צפויה";

    if (status !== 409 && status !== 404) {
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export default api;
