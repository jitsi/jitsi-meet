import axios from "axios";
import { API_URL } from "../config";

const apiRoot = API_URL;

export function fetchCurrentUser() {
  return axios.get(`${apiRoot}/current-user`, { withCredentials: true });
}

export function login(form) {
  return axios.post(`${apiRoot}/login`, form);
}

export function logout() {
  return axios.get(`${apiRoot}/logout`);
}

export function signup(form) {
  return axios.post(`${apiRoot}/signup`, form);
}

export function passwordReset(form) {
  return axios.post(`${apiRoot}/password-reset`, form);
}

export function updateAccount(form) {
  return axios.patch(`${apiRoot}/account`, form);
}

export function passwordResetConfirm(form) {
  return axios.post(`${apiRoot}/password-reset-confirm`, form);
}

export function updatePassword(form) {
  return axios.patch(`${apiRoot}/password-reset-confirm`, form);
}
