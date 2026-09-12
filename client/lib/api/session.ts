const USER_ID_KEY = "atlassfin.session.userId";

const canUseStorage = () => typeof window !== "undefined";

export const sessionStore = {
  getUserId: (): string | null => {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(USER_ID_KEY);
  },
  setUserId: (userId: string): void => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(USER_ID_KEY, userId);
  },
  clear: (): void => {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(USER_ID_KEY);
  },
};
