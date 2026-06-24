// Curated list of weather station coordinates used for daily accuracy polling.
// Using actual station positions ensures the nearest-station lookup in the
// observation services returns exactly that station, eliminating distance error.
//
// Sources:
//   SE — SMHI metobs /parameter/1.json (active stations)
//   NO — Frost /sources/v0.jsonld
//   FI — FMI WFS observation responses (gml:pos)

const referenceStations = [
  // Sweden
  { name: 'Stockholm Observatoriekullen', lat: 59.3417, lon: 18.0549, country: 'SE' },
  { name: 'Göteborg A',                   lat: 57.7156, lon: 11.9924, country: 'SE' },
  { name: 'Malmö A',                      lat: 55.5715, lon: 13.0708, country: 'SE' },
  { name: 'Umeå Flygplats',              lat: 63.7931, lon: 20.2800, country: 'SE' },
  { name: 'Luleå-Kallax Flygplats',      lat: 65.5430, lon: 22.1240, country: 'SE' },
  { name: 'Kiruna',                       lat: 67.8565, lon: 20.2937, country: 'SE' },

  // Norway
  { name: 'Oslo Blindern',               lat: 59.9423, lon: 10.7200, country: 'NO' },
  { name: 'Bergen Florida',              lat: 60.3830, lon:  5.3327, country: 'NO' },
  { name: 'Trondheim Voll',             lat: 63.4107, lon: 10.4538, country: 'NO' },
  { name: 'Tromsø',                      lat: 69.6537, lon: 18.9368, country: 'NO' },

  // Finland
  { name: 'Helsinki',                    lat: 60.1752, lon: 24.9446, country: 'FI' },
  { name: 'Tampere',                     lat: 61.5176, lon: 23.7539, country: 'FI' },
  { name: 'Oulu',                        lat: 64.9969, lon: 25.5223, country: 'FI' },
];

export default referenceStations;
