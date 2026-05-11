export const index = (req, res) => {
  return res.status(200).json({
    resources: [
      {
        name: 'RequestLog',
        endpoint: '/v1/requestLogs',
        meta: '/v1/requestLogs/meta'
      },
      {
        name: 'ErrorLog',
        endpoint: '/v1/errorLogs',
        meta: '/v1/errorLogs/meta'
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
