export const API_BASE_URL = "https://resawc-llp-1-rt4y.vercel.app/api";

export let globalUser: any = null;
export function setGlobalUser(user: any) {
  globalUser = user;
}

export let setGlobalAuthState: (state: boolean) => void = () => {};
export function registerAuthCallback(callback: (state: boolean) => void) {
  setGlobalAuthState = callback;
}

export function logout() {
  setGlobalUser(null);
  setGlobalAuthState(false);
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return await res.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    return { success: false, error: 'Network request failed' };
  }
}
