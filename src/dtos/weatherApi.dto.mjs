const weatherApiDto = {
  weatherWarnings: (data) => {
    if (!data || !data.alerts?.alert?.[0]) return null;
    const alertData = data.alerts.alert;
    const alert = alertData[0];

    return {
      severity: translateSeverity(alert.severity.toLowerCase()) || null,
      severityDescription: alert.instruction || null,
      title: alert.headline || null,
      description: alert.desc || null,
      type: alert.event || null,
      warningsCount: alertData.length || 0,
      raw: alertData,
    };
  },
};
const translateSeverity = (severity) => {
  switch (severity) {
    case "minor":
        return "YELLOW";
    case "moderate":
        return "ORANGE";
    case "severe":
        return "RED";
    case "extreme":
        return "RED";
    case "unknown":
        return "YELLOW";
    default:
      return "Unknown";
  }
};
export default weatherApiDto;