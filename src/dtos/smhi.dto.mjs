const smhiDto = {
  weatherWarnings: (data) => {
    if (!data) return null;

    return {
      severity: data.inner?.level || null,
      severityDescription: describeSeverity(data.inner?.level) || null,
      title: data.inner?.en || null,
      description: data.inner?.en || null,
      type: data.inner?.type || null,
      warningsCount: data.inner?.warningsCount || 0,
      raw: data,
    };
  },
};

//todo: crate severity enum and add translate layer for enum here
const describeSeverity = (severity) => {
  switch (severity) {
    case 'YELLOW':
      return "Certain risks to the public. Disruptions to some societal functions. Take extra care - especially at places more susceptible to changing weather conditions";
    case 'ORANGE':
      return "Danger to the public. Disruptions to societal functions.Avoid exposure to the weather conditions.";
    case 'RED':
      return "Great danger to the public. Extensive disruptions to societal functions. Avoid all exposure to the weather conditions!";
    case 'NONE':
      return "No warnings in effect.";
    default:
      return "Unknown";
  }
}

export default smhiDto;