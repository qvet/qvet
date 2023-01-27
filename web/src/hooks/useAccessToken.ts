export default function useAccessToken(): string | null {
  return localStorage.getItem("access_token") ?? null;
}
