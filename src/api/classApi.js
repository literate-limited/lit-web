import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});



export const inviteStudent = (payload) =>
  axios.post(`${API_URL}/class/inviteStudent`, payload, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

export const createTeacher = (payload) =>
  axios.post(`${API_URL}/class/createTeacher`, payload, auth());

export const createStudent = (payload) =>
  axios.post(`${API_URL}/class/createStudent`, payload, auth());

export const createClassApi = (payload) =>
  axios.post(`${API_URL}/class/createClass`, payload, auth());

export const addStudentToClass = (payload) =>
  axios.post(`${API_URL}/class/add-student`, payload, auth());

// NEW (for teacher dashboard lists)
export const getMyClasses = () =>
  axios.get(`${API_URL}/class/my-classes`, auth());

export const getClassById = (classId) =>
  axios.get(`${API_URL}/class/${classId}`, auth());
