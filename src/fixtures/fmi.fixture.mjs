// Trimmed snapshot of https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-finland
// Two entries with distinct identifiers; the second uses a different warning type/area.
export const fmiWarningsFixtureParsed = {
  feed: {
    entry: [
      {
        geocode: [{ valueName: 'EMMA_ID', value: 'FI028' }],
        link: [
          { '@_title': 'Etelä-Pohjanmaa, Keski-Pohjanmaa', '@_href': 'https://meteoalarm.org?geocode=EMMA_ID:FI028', '@_hreflang': 'en' },
          { '@_type': 'application/cap+xml', '@_href': 'https://feeds.meteoalarm.org/api/v1/warnings/feeds-finland/93826da5-26d9-41a2-9169-9aaaceeb047c' },
        ],
        areaDesc: 'Etelä-Pohjanmaa, Keski-Pohjanmaa',
        event: 'Wildfire warning',
        sent: '2026-06-22T17:24:38+00:00',
        expires: '2026-06-22T21:00:00+00:00',
        effective: '2026-06-22T17:24:38+00:00',
        onset: '2026-06-22T17:24:38+00:00',
        certainty: 'Likely',
        severity: 'Moderate',
        urgency: 'Future',
        scope: 'Public',
        message_type: 'Update',
        status: 'Actual',
        identifier: '2.49.0.0.246.0.FI.260622172438.2ZZZ2ODA87H2xvz2Hmz9',
        published: '2026-06-22T17:24:38Z',
        id: 'https://feeds.meteoalarm.org/api/v1/warnings/feeds-finland/93826da5-26d9-41a2-9169-9aaaceeb047c?index_info=2&index_area=0&index_geocode=1',
        title: 'Yellow Forest-fire Warning issued for Finland - Etelä-Pohjanmaa, Keski-Pohjanmaa',
        updated: '2026-06-22T17:24:38Z',
      },
      {
        geocode: [{ valueName: 'EMMA_ID', value: 'FI028' }],
        link: [
          { '@_title': 'Varsinais-Suomi, Satakunta, Pirkanmaa, Etelä-Pohjanmaa, Keski-Pohjanmaa', '@_href': 'https://meteoalarm.org?geocode=EMMA_ID:FI028', '@_hreflang': 'en' },
          { '@_type': 'application/cap+xml', '@_href': 'https://feeds.meteoalarm.org/api/v1/warnings/feeds-finland/f62bba1e-dce4-4a80-8d2f-2b494c53979f' },
        ],
        areaDesc: 'Varsinais-Suomi, Satakunta, Pirkanmaa, Etelä-Pohjanmaa, Keski-Pohjanmaa',
        event: 'Wildfire warning',
        sent: '2026-06-22T17:24:38+00:00',
        expires: '2026-06-23T21:00:00+00:00',
        effective: '2026-06-22T17:24:38+00:00',
        onset: '2026-06-22T21:00:00+00:00',
        certainty: 'Possible',
        severity: 'Moderate',
        urgency: 'Future',
        scope: 'Public',
        message_type: 'Update',
        status: 'Actual',
        identifier: '2.49.0.0.246.0.FI.260622172438.QJvLFmh59Tme31NJumD0',
        published: '2026-06-22T17:24:38Z',
        id: 'https://feeds.meteoalarm.org/api/v1/warnings/feeds-finland/f62bba1e-dce4-4a80-8d2f-2b494c53979f?index_info=2&index_area=0&index_geocode=4',
        title: 'Yellow Forest-fire Warning issued for Finland - Varsinais-Suomi, Satakunta, Pirkanmaa, Etelä-Pohjanmaa, Keski-Pohjanmaa',
        updated: '2026-06-22T17:24:38Z',
      },
    ],
  },
};

// An Orange-level entry for testing severity escalation
export const fmiWarningsOrangeFixture = {
  feed: {
    entry: [
      {
        ...fmiWarningsFixtureParsed.feed.entry[0],
        severity: 'Severe',
        title: 'Orange Wind Warning issued for Finland - Uusimaa',
        event: 'Warning for gale-force winds',
        identifier: '2.49.0.0.246.0.FI.TEST.ORANGE',
      },
    ],
  },
};
