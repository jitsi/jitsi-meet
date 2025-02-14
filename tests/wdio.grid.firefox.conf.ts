// wdio.grid.conf.ts
// extends the main configuration file to add the selenium grid address
import { URL } from 'url';

// @ts-ignore
import { config as defaultConfig } from './wdio.firefox.conf.ts';

const gridUrl = new URL(process.env.GRID_HOST_URL as string);
const protocol = gridUrl.protocol.replace(':', '');

export const config = {
    ...defaultConfig,
    protocol,
    hostname: gridUrl.hostname,
    port: gridUrl.port ? parseInt(gridUrl.port, 10) // Convert port to number
        : protocol === 'http' ? 80 : 443,
    path: gridUrl.pathname
};
