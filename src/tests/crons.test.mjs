import { jest } from "@jest/globals";

const requestDestroyMock = jest.fn();
const errorDestroyMock = jest.fn();

jest.unstable_mockModule("../models/index.mjs", () => ({
  sequelize: {
    models: {
      RequestLog: { destroy: requestDestroyMock },
      ErrorLog: { destroy: errorDestroyMock },
    },
  },
}));

// Import after mocks are registered
const { purgeOldLogs } = await import("../jobs/purge-old-logs.mjs");

describe("purgeOldLogs", () => {
  beforeEach(() => {
    requestDestroyMock.mockReset();
    errorDestroyMock.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("deletes logs older than 6 months and returns counts for both log tables", async () => {
    requestDestroyMock.mockResolvedValue(42);
    errorDestroyMock.mockResolvedValue(7);
    jest.setSystemTime(new Date("2026-04-25T05:00:00.000Z"));

    const result = await purgeOldLogs();

    expect(result).toEqual({ deletedRequests: 42, deletedErrors: 7 });
    expect(requestDestroyMock).toHaveBeenCalledTimes(1);
    expect(errorDestroyMock).toHaveBeenCalledTimes(1);
  });

  it("uses a cutoff of exactly 6 months ago", async () => {
    requestDestroyMock.mockResolvedValue(0);
    errorDestroyMock.mockResolvedValue(0);
    const now = new Date("2026-04-25T05:00:00.000Z");
    jest.setSystemTime(now);

    await purgeOldLogs();

    const expectedCutoff = new Date(now.getTime() - 183 * 86400000);
    const requestWhere = requestDestroyMock.mock.calls[0][0].where;
    const errorWhere = errorDestroyMock.mock.calls[0][0].where;
    const requestCutoff = requestWhere.created_at[Object.getOwnPropertySymbols(requestWhere.created_at)[0]];
    const errorCutoff = errorWhere.created_at[Object.getOwnPropertySymbols(errorWhere.created_at)[0]];
    expect(requestCutoff).toEqual(expectedCutoff);
    expect(errorCutoff).toEqual(expectedCutoff);
  });

  it("returns zero counts when no logs are old enough to delete", async () => {
    requestDestroyMock.mockResolvedValue(0);
    errorDestroyMock.mockResolvedValue(0);

    const result = await purgeOldLogs();

    expect(result).toEqual({ deletedRequests: 0, deletedErrors: 0 });
  });

  it("propagates errors thrown by RequestLog.destroy", async () => {
    requestDestroyMock.mockRejectedValue(new Error("DB error"));

    await expect(purgeOldLogs()).rejects.toThrow("DB error");
  });
});
