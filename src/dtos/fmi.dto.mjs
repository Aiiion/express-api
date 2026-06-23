const SEVERITY_PRIORITY = { RED: 3, ORANGE: 2, YELLOW: 1, NONE: 0 };

// Derive severity from the entry title which explicitly names the colour level.
// Falls back to cap:severity if the title doesn't match.
const mapSeverity = (title = '', capSeverity = '') => {
  if (/\bRed\b/i.test(title)) return 'RED';
  if (/\bOrange\b/i.test(title)) return 'ORANGE';
  if (/\bYellow\b/i.test(title)) return 'YELLOW';
  switch (capSeverity.toLowerCase()) {
    case 'extreme': return 'RED';
    case 'severe':  return 'ORANGE';
    case 'moderate':
    case 'minor':   return 'YELLOW';
    default:        return 'NONE';
  }
};

const describeSeverity = (severity) => {
  switch (severity) {
    case 'YELLOW': return 'Be aware of potentially dangerous weather. Stay informed and take precautions.';
    case 'ORANGE': return 'Be prepared for dangerous weather. Disruptions to daily activities are expected.';
    case 'RED':    return 'Take action — extreme weather is occurring. Extensive disruptions and risk to life.';
    case 'NONE':   return 'No warnings in effect.';
    default:       return 'Unknown severity.';
  }
};

const fmiDto = {
  weatherWarnings: (data) => {
    const entries = data?.feed?.entry;
    if (!entries?.length) return null;

    // Deduplicate by identifier so warningsCount reflects unique warnings, not per-region copies.
    const byId = new Map();
    for (const entry of entries) {
      if (entry.identifier && !byId.has(entry.identifier)) {
        byId.set(entry.identifier, entry);
      }
    }

    let mostSevere = null;
    let maxPriority = -1;
    for (const entry of byId.values()) {
      const sev = mapSeverity(entry.title, entry.severity);
      const priority = SEVERITY_PRIORITY[sev] ?? 0;
      if (priority > maxPriority) {
        maxPriority = priority;
        mostSevere = entry;
      }
    }

    if (!mostSevere) return null;

    const severity = mapSeverity(mostSevere.title, mostSevere.severity);

    return {
      severity,
      severityDescription: describeSeverity(severity),
      title: mostSevere.event ?? null,
      description: mostSevere.title ?? null,
      type: mostSevere.event ?? null,
      warningsCount: byId.size,
      raw: entries,
      provider: 'fmi.fi',
    };
  },
};

export default fmiDto;
