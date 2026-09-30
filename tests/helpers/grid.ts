import { URL } from 'url';

/**
 * Points a wdio config at the Selenium Grid given by GRID_HOST_URL (e.g. https://mygrid.com/wd/hub) and rewrites
 * the fake audio capture path in every capability to the copy of the resource available on the grid nodes
 * (REMOTE_RESOURCE_PATH), since a path on this machine means nothing to a remote browser.
 *
 * @param baseConfig - The config to extend. It is not modified.
 * @returns The extended config.
 */
export function applyGridConfig<T extends WebdriverIO.MultiremoteConfig>(baseConfig: T): T {
    const gridUrl = new URL(process.env.GRID_HOST_URL as string);
    const protocol = gridUrl.protocol.replace(':', '');

    const mergedConfig = {
        ...baseConfig,
        protocol,
        hostname: gridUrl.hostname,
        port: gridUrl.port ? parseInt(gridUrl.port, 10) // Convert port to number
            : protocol === 'http' ? 80 : 443,
        path: gridUrl.pathname
    };

    const capabilities = mergedConfig.capabilities as Record<string, any>;

    Object.keys(capabilities).forEach(browser => {
        const chromeOptions = capabilities[browser].capabilities['goog:chromeOptions'];

        if (chromeOptions?.args) {
            chromeOptions.args = updateRemoteResource(chromeOptions.args);
        }
    });

    return mergedConfig;
}

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
