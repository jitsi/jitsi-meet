// wdio.grid.conf.ts
// extends the main configuration file to add the selenium grid address
import { deepmerge } from 'deepmerge-ts';
import { URL } from 'url';

// @ts-ignore
import { config as defaultConfig } from './wdio.conf.ts';

const gridUrl = new URL(process.env.GRID_HOST_URL as string);
const protocol = gridUrl.protocol.replace(':', '');

export const config = deepmerge(defaultConfig, {
    protocol,
    hostname: gridUrl.hostname,
    port: gridUrl.port ? parseInt(gridUrl.port, 10) // Convert port to number
        : protocol === 'http' ? 80 : 443,
    path: gridUrl.pathname
}, { clone: false });
