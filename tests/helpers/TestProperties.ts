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
    usesBrowsers?: string[];
};

const defaultProperties: ITestProperties = {
    useIFrameApi: false,
    useWebhookProxy: false,
    useJaas: false,
    usesBrowsers: [ 'p1', 'p2', 'p3', 'p4' ]
};

function getDefaultProperties(filename: string): ITestProperties {
    const properties = { ...defaultProperties };

    properties.usesBrowsers = getDefaultBrowsers(filename);

    return properties;
}

function getDefaultBrowsers(filename: string): string[] {
    if (filename.includes('/alone/')) {
        return [ 'p1' ];
    }
    if (filename.includes('/2way/')) {
        return [ 'p1', 'p2' ];
    }
    if (filename.includes('/3way/')) {
        return [ 'p1', 'p2', 'p3' ];
    }
    if (filename.includes('/4way/')) {
        return [ 'p1', 'p2', 'p3', 'p4' ];
    }

    // Tests outside /alone/, /2way/, /3way/, /4way/ will default to p1 only.
    return [ 'p1' ];
}

/**
 * Maps a test filename to its registered properties.
 */
export const testProperties: Record<string, ITestProperties> = {};

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

    testProperties[filename] = { ...getDefaultProperties(filename), ...properties };
}

let testFilesLoaded = false;

/**
 * Loads test files to populate the testProperties registry. This function:
 * 1. Mocks test framework globals to prevent test registration
 * 2. require()s each file to trigger setTestProperties calls
 * 3. Restores original test framework functions
 *
 * @param files - Array of file names to load
 */
export function loadTestFiles(files: string[]): void {
    if (testFilesLoaded) {
        return;
    }

    // Temporarily override test functions to prevent tests registering at this stage. We only want TestProperties to be
    // loaded.
    const originalTestFunctions: Record<string, any> = {};
    const testGlobals = [ 'describe', 'it', 'test', 'expect', 'beforeEach', 'afterEach', 'before', 'after', 'beforeAll',
        'afterAll', 'suite', 'setup', 'teardown' ];

    testGlobals.forEach(fn => {
        originalTestFunctions[fn] = (global as any)[fn];
        (global as any)[fn] = () => {
            // do nothing
        };
    });

    try {
        // Load all spec files to trigger setTestProperties calls
        files.forEach(file => {
            try {
                require(file);
                if (!testProperties[file]) {
                    // If no properties were set, apply defaults
                    setTestProperties(file, getDefaultProperties(file));
                }
            } catch (error) {
                console.warn(`Warning: Could not analyze ${file}:`, (error as Error).message);
            }
        });
        testFilesLoaded = true;

    } finally {
        // Restore original functions
        testGlobals.forEach(fn => {
            if (originalTestFunctions[fn] !== undefined) {
                (global as any)[fn] = originalTestFunctions[fn];
            } else {
                delete (global as any)[fn];
            }
        });
        // Clear require cache for analyzed files so they can be loaded fresh by WebDriverIO
        files.forEach(file => {
            delete require.cache[file];
        });
    }
}

/**
 * @param testFilePath - The absolute path to the test file
 * @returns Promise<ITestProperties> - The test properties with defaults applied
 */
export async function getTestProperties(testFilePath: string): Promise<ITestProperties> {
    return testProperties[testFilePath] || getDefaultProperties(testFilePath);
}
