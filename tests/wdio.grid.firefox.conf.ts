// wdio.grid.firefox.conf.ts
// extends the firefox configuration file to add the selenium grid address

import { applyGridConfig } from './helpers/grid';
// @ts-ignore
import { config as defaultConfig } from './wdio.firefox.conf.ts';

export const config = applyGridConfig(defaultConfig);
