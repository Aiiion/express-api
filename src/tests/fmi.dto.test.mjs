import fmiDto from '../dtos/fmi.dto.mjs';
import { fmiWarningsFixtureParsed, fmiWarningsOrangeFixture } from '../fixtures/fmi.fixture.mjs';

describe('fmiDto.weatherWarnings', () => {
  it('returns null for a missing or empty feed', () => {
    expect(fmiDto.weatherWarnings(null)).toBeNull();
    expect(fmiDto.weatherWarnings({})).toBeNull();
    expect(fmiDto.weatherWarnings({ feed: { entry: [] } })).toBeNull();
  });

  it('maps Yellow title to YELLOW severity', () => {
    const result = fmiDto.weatherWarnings(fmiWarningsFixtureParsed);
    expect(result.severity).toBe('YELLOW');
  });

  it('maps Orange title to ORANGE severity', () => {
    const result = fmiDto.weatherWarnings(fmiWarningsOrangeFixture);
    expect(result.severity).toBe('ORANGE');
  });

  it('falls back to cap:severity when title has no colour keyword', () => {
    const data = {
      feed: {
        entry: [{
          identifier: 'test-1',
          severity: 'Severe',
          event: 'Wind warning',
          title: 'Warning issued for Finland',
        }],
      },
    };
    expect(fmiDto.weatherWarnings(data).severity).toBe('ORANGE');
  });

  it('deduplicates entries by identifier so warningsCount reflects unique warnings', () => {
    // fixture has 2 entries but same identifier should count as 1
    const data = {
      feed: {
        entry: [
          { identifier: 'id-A', severity: 'Moderate', event: 'Wind', title: 'Yellow Wind Warning issued for Finland - Region A' },
          { identifier: 'id-A', severity: 'Moderate', event: 'Wind', title: 'Yellow Wind Warning issued for Finland - Region B' },
          { identifier: 'id-B', severity: 'Moderate', event: 'Rain', title: 'Yellow Rain Warning issued for Finland - Region A' },
        ],
      },
    };
    const result = fmiDto.weatherWarnings(data);
    expect(result.warningsCount).toBe(2);
  });

  it('returns the most severe warning when entries have mixed severities', () => {
    const data = {
      feed: {
        entry: [
          { identifier: 'id-1', severity: 'Moderate', event: 'Wildfire', title: 'Yellow Forest-fire Warning issued for Finland - A' },
          { identifier: 'id-2', severity: 'Severe',   event: 'Wind',     title: 'Orange Wind Warning issued for Finland - B' },
        ],
      },
    };
    const result = fmiDto.weatherWarnings(data);
    expect(result.severity).toBe('ORANGE');
    expect(result.title).toBe('Wind');
  });

  it('returns the correct shape', () => {
    const result = fmiDto.weatherWarnings(fmiWarningsFixtureParsed);
    expect(result).toMatchObject({
      severity: expect.any(String),
      severityDescription: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      type: expect.any(String),
      warningsCount: expect.any(Number),
      provider: 'fmi.fi',
    });
    expect(result.raw).toBeDefined();
  });
});
