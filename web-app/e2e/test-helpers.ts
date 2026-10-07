import { Page, request } from '@playwright/test';

let cachedToken: string | null = null;
let cachedUser: any = null;

export async function getAdminAuth() {
  if (cachedToken && cachedUser) return { token: cachedToken, user: cachedUser };

  const apiContext = await request.newContext();
  const res = await apiContext.post('http://localhost:3000/api/auth', {
    data: {
      email: 'mukul@resawc.com',
      password: 'Admin@1234',
    },
  });
  const data = await res.json();
  if (!data.success || !data.token) {
    throw new Error('Failed to acquire admin auth token');
  }
  cachedToken = data.token as string;
  cachedUser = data.user;
  return { token: cachedToken, user: cachedUser };
}

export async function loginAsAdmin(page: Page) {
  const { token, user } = await getAdminAuth();

  // Populate localStorage before any page script executes
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('userId', user.id);
  }, { token, user });
}
