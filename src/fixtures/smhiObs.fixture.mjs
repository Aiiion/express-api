// Trimmed snapshot of SMHI metobs /parameter/{id}.json station list
export const smhiObsStationsFixture = {
  station: [
    { id: 98230, latitude: 59.3417, longitude: 18.0549, active: true,  name: 'Stockholm-Observatoriekullen A' },
    { id: 71420, latitude: 57.7156, longitude: 11.9924, active: true,  name: 'Göteborg A' },
    { id: 25080, latitude: 67.8565, longitude: 20.2937, active: false, name: 'Kiruna (inactive)' },
  ],
};

// Trimmed snapshot of /parameter/1/station/98230/period/latest-day/data.json
// value is a string; quality 'G' = good, 'Y' = provisional, others discarded
export const smhiObsDataFixture = {
  value: [
    { date: '1750000000000', value: '14.2', quality: 'G' },
    { date: '1750003600000', value: '15.0', quality: 'G' },
    { date: '1750007200000', value: '13.8', quality: 'Y' },
    { date: '1750010800000', value: '99.9', quality: 'Z' }, // bad quality — must be excluded
  ],
};
