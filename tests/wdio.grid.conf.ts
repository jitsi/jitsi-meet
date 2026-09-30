// wdio.grid.conf.ts
// extends the main configuration file to add the selenium grid address

import { applyGridConfig } from './helpers/grid';
// @ts-ignore
import { config as defaultConfig } from './wdio.conf.ts';

export const config = applyGridConfig(defaultConfig);
