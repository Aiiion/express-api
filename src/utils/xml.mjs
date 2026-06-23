import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  isArray: (name) => ['member', 'entry', 'link', 'geocode', 'info', 'parameter', 'area'].includes(name),
});

export const parseXml = (xmlString) => parser.parse(xmlString);
