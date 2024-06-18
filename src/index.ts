import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings.js';
import { EnviroIndoorPlatform } from './platform.js';

/**
 * This method registers the platform with Homebridge
 */
export default (api: API): void => {
  api.registerPlatform(PLATFORM_NAME, EnviroIndoorPlatform);
};
