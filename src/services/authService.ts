import { fetchApi } from "./fetchApi";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  user_type_id: string;
}

interface SignInResponse extends SessionUser {
  token: string;
}

const USER_KEY = "authUser";

export const authService = {
  signIn: async (email: string, password: string): Promise<SessionUser> => {
    const { token, ...user } = await fetchApi<SignInResponse>("/sign-in", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("authToken", token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  getUser: (): SessionUser | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  },

  signOut: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem(USER_KEY);
  },
};
