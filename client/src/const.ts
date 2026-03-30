export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Native login URL — points to the in-app login page.
export const getLoginUrl = (returnPath?: string): string => {
  if (returnPath) {
    return `/login?return=${encodeURIComponent(returnPath)}`;
  }
  return "/login";
};
