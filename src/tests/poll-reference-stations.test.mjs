import { jest } from '@jest/globals';

const allWeatherMock = jest.fn();

jest.unstable_mockModule('../services/weatherAggregator.service.mjs', () => ({
  default: { allWeather: allWeatherMock },
}));

const { pollReferenceStations } = await import('../jobs/poll-reference-stations.mjs');

import referenceStations from '../data/referenceStations.mjs';

describe('pollReferenceStations', () => {
  beforeEach(() => {
    allWeatherMock.mockReset();
  });

  it('calls allWeather once per reference station', async () => {
    allWeatherMock.mockResolvedValue({});

    await pollReferenceStations();

    expect(allWeatherMock).toHaveBeenCalledTimes(referenceStations.length);
  });

  it('calls allWeather with the correct lat/lon for each station', async () => {
    allWeatherMock.mockResolvedValue({});

    await pollReferenceStations();

    for (const station of referenceStations) {
      expect(allWeatherMock).toHaveBeenCalledWith(station.lat, station.lon);
    }
  });

  it('counts succeeded and failed stations correctly', async () => {
    // First station fails, rest succeed
    allWeatherMock
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue({});

    const result = await pollReferenceStations();

    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(referenceStations.length - 1);
    expect(result.total).toBe(referenceStations.length);
  });

  it('continues polling remaining stations after one fails', async () => {
    allWeatherMock
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue({});

    await pollReferenceStations();

    // All stations should have been attempted despite the first failure
    expect(allWeatherMock).toHaveBeenCalledTimes(referenceStations.length);
  });

  it('returns total equal to the number of reference stations', async () => {
    allWeatherMock.mockResolvedValue({});
    const { total } = await pollReferenceStations();
    expect(total).toBe(referenceStations.length);
  });
});
