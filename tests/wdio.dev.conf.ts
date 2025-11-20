// wdio.dev.conf.ts
// extends the main configuration file for the development environment (make dev)
// it will connect to the webpack-dev-server running locally on port 8080
import { merge } from 'lodash-es';

// @ts-ignore
import { config as defaultConfig } from './wdio.conf.ts';

export const config = merge(defaultConfig, {
    baseUrl: 'https://127.0.0.1:8080/torture'
}, { clone: false });
