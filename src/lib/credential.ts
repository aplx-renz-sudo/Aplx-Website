const SESSION_KEY = 'aplx:gemini-key'; const REMEMBER_KEY = 'aplx:remember-key';
export function loadKey() { return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || ''; }
export function saveKey(key: string, remember: boolean) { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, key); localStorage.setItem(REMEMBER_KEY, String(remember)); }
export function removeKey() { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); }
export function getRemember() { return localStorage.getItem(REMEMBER_KEY) === 'true'; }
export function clearLocalData() { removeKey(); localStorage.removeItem(REMEMBER_KEY); }
