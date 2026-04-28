import { jest } from "@jest/globals";

const destroyMock = jest.fn();

jest.unstable_mockModule("../models/index.mjs", () => ({
  sequelize: {
    models: {
      RequestLog: { destroy: destroyMock },
    },
  },
}));

// Import after mocks are registered
const { purgeOldLogs } = await import("../jobs/purge-old-logs.mjs");

describe("purgeOldLogs", () => {
  beforeEach(() => {
    destroyMock.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("deletes logs older than 6 months and returns the count", async () => {
    destroyMock.mockResolvedValue(42);
    jest.setSystemTime(new Date("2026-04-25T05:00:00.000Z"));

    const result = await purgeOldLogs();

    expect(result).toBe(42);
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  it("uses a cutoff of exactly 6 months ago", async () => {
    destroyMock.mockResolvedValue(0);
    const now = new Date("2026-04-25T05:00:00.000Z");
    jest.setSystemTime(now);

    await purgeOldLogs();

    const expectedCutoff = new Date(now.getTime() - 183 * 86400000);
    const { where } = destroyMock.mock.calls[0][0];
    const actualCutoff = where.created_at[Object.getOwnPropertySymbols(where.created_at)[0]];
    expect(actualCutoff).toEqual(expectedCutoff);
  });

  it("returns 0 when no logs are old enough to delete", async () => {
    destroyMock.mockResolvedValue(0);

    const result = await purgeOldLogs();

    expect(result).toBe(0);
  });

  it("propagates errors thrown by Log.destroy", async () => {
    destroyMock.mockRejectedValue(new Error("DB error"));

    await expect(purgeOldLogs()).rejects.toThrow("DB error");
  });
});
