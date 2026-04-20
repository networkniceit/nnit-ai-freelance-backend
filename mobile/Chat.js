// mobile/Chat.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/chat';
export const getMessages = async (chatId, token) => axios.get(`${API_URL}/${chatId}`, { headers: { Authorization: `Bearer ${token}` } });
export const sendMessage = async (chatId, message, token) => axios.post(`${API_URL}/${chatId}`, { message }, { headers: { Authorization: `Bearer ${token}` } });
