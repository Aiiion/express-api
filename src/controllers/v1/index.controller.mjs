import { getManifest } from '../../routes/v1/routeManifest.mjs';

export const index = (_req, res) => {
  return res.status(200).json(getManifest());
};
