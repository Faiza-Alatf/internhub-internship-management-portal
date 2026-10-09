// Token + user are kept in localStorage ("Remember me") or sessionStorage (until the tab closes)
const TOKEN_KEY = 'ip_token';
const USER_KEY = 'ip_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveSession(token, user, remember) {
  clearSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));
}

export function updateStoredUser(user) {
  const store = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
  store.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  [localStorage, sessionStorage].forEach((s) => { s.removeItem(TOKEN_KEY); s.removeItem(USER_KEY); });
}
