// Pre-parsed output of fetchWfsBsSimple for fmi::observations::weather::simple
// (what the service receives after wfs.mjs pivots the XML into time-keyed objects)
export const fmiObsFixture = {
  timeSeries: [
    {
      time: '2026-06-23T00:00:00Z',
      lat: 60.1752,
      lon: 24.9446,
      temperature:    12.5,
      humidity:       78.0,
      windspeedms:     3.2,
      winddirection:  180,
      precipitation1h: 0.0,
      pressure:      1015.0,
    },
    {
      time: '2026-06-23T01:00:00Z',
      lat: 60.1752,
      lon: 24.9446,
      temperature:    12.1,
      humidity:       80.0,
      windspeedms:     2.8,
      winddirection:  175,
      precipitation1h: 0.4,
      pressure:      1014.6,
    },
  ],
};
