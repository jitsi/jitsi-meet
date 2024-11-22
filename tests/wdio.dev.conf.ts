// wdio.dev.conf.ts
// extends te main configuration file for the development environment (make dev)
// it will connect to the webpack-dev-server running locally on port 8080
import { deepmerge } from 'deepmerge-ts';

// @ts-ignore
import { config as defaultConfig } from './wdio.conf.ts';

export const config = deepmerge(defaultConfig, {
    baseUrl: 'https://127.0.0.1:8080/torture'
}, { clone: false });
