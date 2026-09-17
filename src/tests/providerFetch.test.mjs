import { jest } from "@jest/globals";
import { providerFetch } from "../utils/providerFetch.mjs";

const jsonResponse = (body) => ({ ok: true, status: 200, statusText: "OK", json: async () => body, text: async () => JSON.stringify(body) });
const errorResponse = (status, statusText) => ({ ok: false, status, statusText, json: async () => ({}), text: async () => "" });

describe("providerFetch", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it("returns the parsed body on success", async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ ok: 1 }));

    await expect(providerFetch("Test", "https://example.test")).resolves.toEqual({ ok: 1 });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries once on a network error and on a 5xx", async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse({ ok: 1 }));
    await expect(providerFetch("Test", "https://example.test")).resolves.toEqual({ ok: 1 });
    expect(global.fetch).toHaveBeenCalledTimes(2);

    global.fetch = jest.fn()
      .mockResolvedValueOnce(errorResponse(503, "Service Unavailable"))
      .mockResolvedValueOnce(jsonResponse({ ok: 2 }));
    await expect(providerFetch("Test", "https://example.test")).resolves.toEqual({ ok: 2 });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 4xx", async () => {
    global.fetch = jest.fn().mockResolvedValue(errorResponse(404, "Not Found"));

    await expect(providerFetch("Test", "https://example.test")).rejects.toThrow("Test error: 404 Not Found");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries when the connection fails while the body is still streaming", async () => {
    // fetch() resolves once headers arrive; the body read can still fail
    const truncated = { ...jsonResponse({}), json: async () => { throw new DOMException("The operation was aborted due to timeout", "TimeoutError"); } };
    global.fetch = jest.fn()
      .mockResolvedValueOnce(truncated)
      .mockResolvedValueOnce(jsonResponse({ ok: 1 }));

    await expect(providerFetch("Test", "https://example.test")).resolves.toEqual({ ok: 1 });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry a body that arrived but is not valid JSON", async () => {
    const malformed = { ...jsonResponse({}), json: async () => JSON.parse("{not json") };
    global.fetch = jest.fn().mockResolvedValue(malformed);

    await expect(providerFetch("Test", "https://example.test")).rejects.toThrow(SyntaxError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns raw text when asked to", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "<xml/>" });

    await expect(providerFetch("Test", "https://example.test", { parse: "text" })).resolves.toBe("<xml/>");
  });
});
