export const index = (req, res) => {
  return res.status(200).json({
    resources: [
      {
        name: 'RequestLog',
        endpoint: '/v1/logs',
        meta: '/v1/logs/meta'
      },
      {
        name: 'ErrorLog',
        endpoint: '/v1/error-logs',
        meta: '/v1/error-logs/meta'
      }
    ],
    aggregates: [
      {
        name: 'Weather',
        description: 'Aggregated weather data from multiple external sources',
        endpoint: '/v1/weather'
      }
    ]
  });
};
