// api/auth.js
import api from "./axios";

export const login = (email, password) => {
  return api.post("peneliti/login", { email, password });
};

export const register = (data) => {
  return api.post("peneliti/register", data);
};

export const logout = () => {
  return api.post("peneliti/logout");
};
