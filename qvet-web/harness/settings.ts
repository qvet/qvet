const params = new URLSearchParams(window.location.search);
const num = (key: string, fallback: number) => {
  const value = params.get(key);
  return value === null || value === "" ? fallback : Number(value);
};

export const settings = {
  total: num("total", 640),
  delayMs: num("delay", 1500),
  jitterMs: num("jitter", 8000),
  // Blank uses delay and jitter like every other page.
  firstPageMs: params.get("first") ? Number(params.get("first")) : null,
  // 0 disables; otherwise that page returns a 500
  failPage: num("fail", 0),
};
