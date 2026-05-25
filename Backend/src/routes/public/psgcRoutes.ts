import { PsgcController } from '@/controllers/public/Psgc.Controller';
import { Router } from 'express';

const psgcRoutes = Router();

psgcRoutes.get('/regions', PsgcController.getRegions);
psgcRoutes.get('/regions/:regionCode/provinces', PsgcController.getProvinces);
psgcRoutes.get('/regions/:regionCode/municipalities', PsgcController.getMunicipalitiesForRegion);
psgcRoutes.get('/provinces/:provinceCode/municipalities', PsgcController.getMunicipalities);
psgcRoutes.get('/municipalities/:municipalityCode/barangays', PsgcController.getBarangays);

export default psgcRoutes;
