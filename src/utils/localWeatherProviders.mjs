import fmiDto from '../dtos/fmi.dto.mjs';
import metDto from '../dtos/met.dto.mjs';
import smhiDto from '../dtos/smhi.dto.mjs';
import fmiService from '../services/providers/fmi.service.mjs';
import metService from '../services/providers/met.service.mjs';
import smhiService from '../services/providers/smhi.service.mjs';

const localWeatherProviders = {
  SE: {
    name: 'SMHI',
    service: smhiService,
    dto: smhiDto,
  },
  NO: {
    name: 'Yr',
    service: metService,
    dto: metDto,
  },
  FI: {
    name: 'FMI',
    service: fmiService,
    dto: fmiDto,
  },
};

export default localWeatherProviders;
