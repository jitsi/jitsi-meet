/**
 * An interface that tests can export (as a TEST_PROPERTIES property) to define what they require.
 */
export type ITestProperties = {
    /** The test uses the iFrame API. */
    useIFrameApi: boolean;
    /** The test requires jaas, it should be skipped when the jaas configuration is not enabled. */
    useJaas: boolean;
    /** The test requires the webhook proxy. */
    useWebhookProxy: boolean;
};

const defaultProperties: ITestProperties = {
    useIFrameApi: false,
    useWebhookProxy: false,
    useJaas: false
};

const testProperties: Record<string, ITestProperties> = {};

/**
 * Set properties for a test file. This was needed because I couldn't find a hook that executes with describe() before
 * the code in wdio.conf.ts's before() hook. The intention is for tests to execute this directly. The properties don't
 * change dynamically.
 *
 * @param filename the absolute path to the test file
 * @param properties the properties to set for the test file, defaults will be applied for missing properties
 */
export function setTestProperties(filename: string, properties: Partial<ITestProperties>): void {
    if (testProperties[filename]) {
        console.warn(`Test properties for ${filename} are already set. Overwriting.`);
    }

    testProperties[filename] = { ...defaultProperties, ...properties };
}

/**
 * @param testFilePath - The absolute path to the test file
 * @returns Promise<ITestProperties> - The test properties with defaults applied
 */
export async function getTestProperties(testFilePath: string): Promise<ITestProperties> {
    return testProperties[testFilePath] || { ...defaultProperties };
}
