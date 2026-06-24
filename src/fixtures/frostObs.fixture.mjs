// Trimmed snapshot of https://frost.met.no/observations/v0.jsonld
// Two time steps, each with all five elements we extract
export const frostObsFixture = {
  data: [
    {
      sourceId: 'SN18700:0',
      referenceTime: '2026-06-23T00:00:00Z',
      observations: [
        { elementId: 'air_temperature',                    value: '12.3', unit: 'degC'  },
        { elementId: 'sum(precipitation_amount PT1H)',     value: '0.5',  unit: 'mm'    },
        { elementId: 'wind_speed',                         value: '5.2',  unit: 'm/s'   },
        { elementId: 'relative_humidity',                  value: '82.0', unit: '%'     },
        { elementId: 'air_pressure_at_sea_level',          value: '1013.2', unit: 'hPa' },
      ],
    },
    {
      sourceId: 'SN18700:0',
      referenceTime: '2026-06-23T01:00:00Z',
      observations: [
        { elementId: 'air_temperature',                    value: '13.1', unit: 'degC'  },
        { elementId: 'sum(precipitation_amount PT1H)',     value: '0.2',  unit: 'mm'    },
        { elementId: 'wind_speed',                         value: '4.8',  unit: 'm/s'   },
        { elementId: 'relative_humidity',                  value: '78.0', unit: '%'     },
        { elementId: 'air_pressure_at_sea_level',          value: '1012.8', unit: 'hPa' },
      ],
    },
  ],
};
