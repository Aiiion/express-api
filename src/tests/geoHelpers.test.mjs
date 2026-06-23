import { getCoordinateBound } from '../utils/geoHelpers.mjs';

describe('getCoordinateBound', () => {
  it('routes Helsinki to Finland', () => {
    const result = getCoordinateBound(60.17, 24.94);
    expect(result.country).toBe('Finland');
    expect(result.provider.name).toBe('FMI');
  });

  it('routes Rovaniemi (northern Finland) to Finland', () => {
    const result = getCoordinateBound(66.5, 25.73);
    expect(result.country).toBe('Finland');
  });

  it('routes Stockholm to Sweden', () => {
    const result = getCoordinateBound(59.33, 18.07);
    expect(result.country).toBe('Sweden');
    expect(result.provider.name).toBe('SMHI');
  });

  it('routes Oslo to Norway', () => {
    const result = getCoordinateBound(59.91, 10.75);
    expect(result.country).toBe('Norway');
    expect(result.provider.name).toBe('Yr');
  });

  it('routes London to Global fallback', () => {
    const result = getCoordinateBound(51.5, -0.12);
    expect(result.country).toBe('Global');
  });

  it('routes New York to Global fallback', () => {
    const result = getCoordinateBound(40.71, -74.01);
    expect(result.country).toBe('Global');
  });

  it('accepts string coordinates (as passed by the controller from query params)', () => {
    const result = getCoordinateBound('60.17', '24.94');
    expect(result.country).toBe('Finland');
  });
});
