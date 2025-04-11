// wdio.grid.conf.ts
// extends the main configuration file to add the selenium grid address
import { URL } from 'url';

// @ts-ignore
import { config as defaultConfig } from './wdio.conf.ts';

const gridUrl = new URL(process.env.GRID_HOST_URL as string);
const protocol = gridUrl.protocol.replace(':', '');

const mergedConfig = {
    ...defaultConfig,
    protocol,
    hostname: gridUrl.hostname,
    port: gridUrl.port ? parseInt(gridUrl.port, 10) // Convert port to number
        : protocol === 'http' ? 80 : 443,
    path: gridUrl.pathname
};

mergedConfig.capabilities.p1.capabilities['goog:chromeOptions'].args
    = updateRemoteResource(mergedConfig.capabilities.p1.capabilities['goog:chromeOptions'].args);
mergedConfig.capabilities.p2.capabilities['goog:chromeOptions'].args
    = updateRemoteResource(mergedConfig.capabilities.p2.capabilities['goog:chromeOptions'].args);
mergedConfig.capabilities.p3.capabilities['goog:chromeOptions'].args
    = updateRemoteResource(mergedConfig.capabilities.p3.capabilities['goog:chromeOptions'].args);
mergedConfig.capabilities.p4.capabilities['goog:chromeOptions'].args
    = updateRemoteResource(mergedConfig.capabilities.p4.capabilities['goog:chromeOptions'].args);

export const config = mergedConfig;

/**
 * Updates the array of arguments for the Chrome browser to use a remote resource for fake audio capture.
 * @param arr
 */
function updateRemoteResource(arr: string[]): string[] {
    // eslint-disable-next-line no-confusing-arrow
    return arr.map((item: string) => item.startsWith('--use-file-for-fake-audio-capture=')
        ? `--use-file-for-fake-audio-capture=${process.env.REMOTE_RESOURCE_PATH}/fakeAudioStream.wav` : item
    );
}
