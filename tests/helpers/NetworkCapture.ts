import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { type CDPSession } from 'puppeteer-core';

/**
 * Represents a captured network request with its metadata.
 */
interface INetworkRequest {
    /** Failure reason if request failed. */
    failureText?: string;
    /** Whether response came from cache. */
    fromCache?: boolean;
    /** HTTP method (GET, POST, etc.). */
    method: string;
    /** Unique request identifier from CDP. */
    requestId: string;
    /** Type of resource (Document, Stylesheet, XHR, etc.). */
    resourceType?: string;
    /** HTTP status code (200, 404, etc.). */
    status?: number;
    /** Whether the request completed successfully. */
    success?: boolean;
    /** Timestamp when request was initiated (Unix time in ms). */
    timestamp: number;
    /** Full URL of the request. */
    url: string;
}

/**
 * Statistics about captured network requests.
 */
interface INetworkStats {
    /** Requests grouped by domain. */
    byDomain: Record<string, number>;
    /** Requests grouped by resource type. */
    byResourceType: Record<string, number>;
    /** Requests grouped by HTTP status code. */
    byStatus: Record<number, number>;
    /** Number of requests served from cache. */
    cachedRequests: number;
    /** Number of failed requests. */
    failed: number;
    /** Number of successful requests. */
    succeeded: number;
    /** Total number of requests. */
    total: number;
}

/**
 * Helper class to capture network requests during WDIO tests using Chrome DevTools Protocol via Puppeteer.
 *
 * This implementation uses puppeteer-core to connect directly to Chrome's debugging port,
 * which allows it to work with WebDriverIO's multiremote mode (unlike @wdio/devtools-service).
 *
 * Usage:
 * ```typescript
 * const capture = new NetworkCapture(driver);
 * await capture.start();
 * // ... perform test actions ...
 * await capture.stop();
 * const stats = capture.getStats();
 * capture.exportToJSON('network-capture.json');
 * ```
 */
export class NetworkCapture {
    private cdpClient: CDPSession | null = null;
    private driver: WebdriverIO.Browser;
    private isCapturing: boolean;
    private requests: Map<string, INetworkRequest>;

    /**
     * Creates a new NetworkCapture instance.
     *
     * @param {WebdriverIO.Browser} driver - WebDriverIO browser instance.
     */
    constructor(driver: WebdriverIO.Browser) {
        this.driver = driver;
        this.requests = new Map();
        this.isCapturing = false;
    }

    /**
     * Resolves the actual debugger address to connect to.
     * Supports both local testing (default) and remote grid nodes.
     *
     * Configuration options (in priority order):
     * 1. Custom capability 'custom:nodeHostname' - explicit node hostname
     * 2. Environment variable GRID_NODE_HOSTNAME - static hostname for all nodes
     * 3. Default: use debuggerAddress as-is (localhost) - for local testing
     *
     * @param {string} debuggerAddress - Address from Chrome capabilities (e.g., "localhost:65243").
     * @returns {string} Resolved address to connect to.
     *
     * @example
     * // Local testing (default):
     * resolveDebuggerAddress('localhost:65243') → 'localhost:65243'
     *
     * // Grid with custom capability:
     * driver.capabilities['custom:nodeHostname'] = 'node-1.grid.com'
     * resolveDebuggerAddress('localhost:65243') → 'node-1.grid.com:65243'
     *
     * // Grid with environment variable:
     * GRID_NODE_HOSTNAME=node-1.grid.com
     * resolveDebuggerAddress('localhost:65243') → 'node-1.grid.com:65243'
     */
    private resolveDebuggerAddress(debuggerAddress: string): string {
        // Option 1: Check for custom capability (highest priority)
        const customNodeHost = (this.driver.capabilities as any)['custom:nodeHostname'];

        if (customNodeHost) {
            const [ , port ] = debuggerAddress.split(':');

            console.log(`NetworkCapture: Using grid node hostname from capability: ${customNodeHost}:${port}`);

            return `${customNodeHost}:${port}`;
        }

        // Option 2: Check for environment variable
        const envNodeHost = process.env.GRID_NODE_HOSTNAME;

        if (envNodeHost) {
            const [ , port ] = debuggerAddress.split(':');

            console.log(`NetworkCapture: Using grid node hostname from env: ${envNodeHost}:${port}`);

            return `${envNodeHost}:${port}`;
        }

        // Option 3: Default - use debuggerAddress as-is (local testing)
        console.log(`NetworkCapture: Using local debugger address: ${debuggerAddress}`);

        return debuggerAddress;
    }

    /**
     * Starts capturing network requests via CDP using Puppeteer.
     * Connects to Chrome's debugging port and enables the Network domain.
     *
     * @returns {Promise<void>}
     */
    async start(): Promise<void> {
        if (this.isCapturing) {
            console.warn('NetworkCapture: Already capturing, ignoring start()');

            return;
        }

        try {
            // Get the debugging address from Chrome capabilities
            const debuggerAddress = this.driver.capabilities['goog:chromeOptions']?.debuggerAddress;

            if (!debuggerAddress) {
                throw new Error('Chrome debugger address not found in capabilities');
            }

            // Resolve the actual address to connect to (supports both local and grid setups)
            const actualAddress = this.resolveDebuggerAddress(debuggerAddress);

            // Fetch the WebSocket debugger URL from Chrome's /json/version endpoint
            const response = await fetch(`http://${actualAddress}/json/version`);

            if (!response.ok) {
                throw new Error(`Failed to fetch debugger info: ${response.status} ${response.statusText}`);
            }

            const versionInfo = await response.json() as { webSocketDebuggerUrl: string; };
            const wsUrl = versionInfo.webSocketDebuggerUrl;

            if (!wsUrl) {
                throw new Error('webSocketDebuggerUrl not found in debugger info');
            }

            // Connect Puppeteer to the existing Chrome instance using the correct WebSocket URL
            const browser = await puppeteer.connect({
                browserWSEndpoint: wsUrl,
                defaultViewport: null
            });

            // Get the first page/target
            const targets = await browser.targets();
            const target = targets.find(t => t.type() === 'page') || targets[0];

            if (!target) {
                throw new Error('No page target found');
            }

            // Create CDP session
            this.cdpClient = await target.createCDPSession();

            // Enable Network domain
            await this.cdpClient.send('Network.enable');

            // Listen for network events
            this.cdpClient.on('Network.requestWillBeSent', this.handleRequestWillBeSent.bind(this));
            this.cdpClient.on('Network.responseReceived', this.handleResponseReceived.bind(this));
            this.cdpClient.on('Network.loadingFailed', this.handleLoadingFailed.bind(this));

            this.isCapturing = true;
            console.log('NetworkCapture: Started capturing network requests via Puppeteer CDP');
        } catch (error) {
            console.error('NetworkCapture: Failed to start capturing:', error);
            throw error;
        }
    }

    /**
     * Stops capturing network requests and closes CDP connection.
     *
     * @returns {Promise<void>}
     */
    async stop(): Promise<void> {
        if (!this.isCapturing || !this.cdpClient) {
            return;
        }

        try {
            // Disable Network domain
            await this.cdpClient.send('Network.disable');

            // Detach CDP session
            await this.cdpClient.detach();

            this.cdpClient = null;
            this.isCapturing = false;
            console.log(`NetworkCapture: Stopped capturing. Total requests: ${this.requests.size}`);
        } catch (error) {
            console.error('NetworkCapture: Failed to stop capturing:', error);
            throw error;
        }
    }

    /**
     * Handles Network.requestWillBeSent CDP events.
     * Records initial request data.
     *
     * @param {any} params - CDP event parameters.
     */
    private handleRequestWillBeSent(params: any): void {
        const { requestId, request, timestamp, type } = params;

        this.requests.set(requestId, {
            failureText: undefined,
            fromCache: false,
            method: request.method,
            requestId,
            resourceType: type,
            status: undefined,
            success: undefined,
            timestamp: timestamp * 1000, // CDP uses seconds, convert to ms
            url: request.url
        });
    }

    /**
     * Handles Network.responseReceived CDP events.
     * Updates request with response status and cache info.
     *
     * @param {any} params - CDP event parameters.
     */
    private handleResponseReceived(params: any): void {
        const { requestId, response } = params;
        const request = this.requests.get(requestId);

        if (request) {
            request.status = response.status;
            request.success = response.status >= 200 && response.status < 400;
            request.fromCache = response.fromDiskCache || response.fromServiceWorker || false;
        }
    }

    /**
     * Handles Network.loadingFailed CDP events.
     * Marks request as failed and records reason.
     *
     * @param {any} params - CDP event parameters.
     */
    private handleLoadingFailed(params: any): void {
        const { requestId, errorText } = params;
        const request = this.requests.get(requestId);

        if (request) {
            request.success = false;
            request.failureText = errorText;
        }
    }

    /**
     * Returns all captured network requests.
     *
     * @returns {INetworkRequest[]} Array of captured requests.
     */
    getRequests(): INetworkRequest[] {
        return Array.from(this.requests.values());
    }

    /**
     * Returns URLs of all captured requests.
     *
     * @returns {string[]} Array of URLs.
     */
    getUrls(): string[] {
        return this.getRequests().map(req => req.url);
    }

    /**
     * Returns URLs that failed to load.
     *
     * @returns {string[]} Array of failed URLs with failure reasons.
     */
    getFailedUrls(): Array<{ reason?: string; url: string; }> {
        return this.getRequests()
            .filter(req => req.success === false)
            .map(req => ({ reason: req.failureText, url: req.url }));
    }

    /**
     * Calculates statistics about captured network requests.
     *
     * @returns {INetworkStats} Statistics object.
     */
    getStats(): INetworkStats {
        const requests = this.getRequests();
        const stats: INetworkStats = {
            byDomain: {},
            byResourceType: {},
            byStatus: {},
            cachedRequests: 0,
            failed: 0,
            succeeded: 0,
            total: requests.length
        };

        for (const request of requests) {
            // Count success/failure
            if (request.success === true) {
                stats.succeeded++;
            } else if (request.success === false) {
                stats.failed++;
            }

            // Group by status code
            if (request.status) {
                stats.byStatus[request.status] = (stats.byStatus[request.status] || 0) + 1;
            }

            // Group by domain
            try {
                const url = new URL(request.url);
                const domain = url.hostname;

                stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;
            } catch (e) {
                // Invalid URL, skip domain grouping
            }

            // Group by resource type
            if (request.resourceType) {
                stats.byResourceType[request.resourceType]
                    = (stats.byResourceType[request.resourceType] || 0) + 1;
            }

            // Count cached requests
            if (request.fromCache) {
                stats.cachedRequests++;
            }
        }

        return stats;
    }

    /**
     * Exports captured requests to a JSON file.
     *
     * @param {string} filePath - Path where to save the JSON file.
     */
    exportToJSON(filePath: string): void {
        const data = {
            captureDate: new Date().toISOString(),
            requests: this.getRequests(),
            stats: this.getStats()
        };

        // Ensure directory exists
        const dir = path.dirname(filePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`NetworkCapture: Exported ${data.requests.length} requests to ${filePath}`);
    }

    /**
     * Clears all captured requests.
     */
    clear(): void {
        this.requests.clear();
        console.log('NetworkCapture: Cleared all captured requests');
    }
}
