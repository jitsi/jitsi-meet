# Network Request Capture for WDIO Tests

This feature enables capturing and analyzing all network requests made during WebDriverIO test execution. It uses Chrome DevTools Protocol (CDP) to intercept and log network activity.

## Features

- **URL Capture**: Records all URLs requested during tests
- **Basic Statistics**: Success/failure counts, status codes, response timing
- **Domain Analysis**: Groups requests by domain
- **Resource Type Tracking**: Categorizes by resource type (Document, Script, XHR, etc.)
- **Cache Detection**: Identifies cached vs. fresh requests
- **Failure Tracking**: Records failed requests with error messages
- **Multiple Export Formats**: JSON, CSV, plain text

## Requirements

- **Chrome Browser**: Network capture uses Chrome DevTools Protocol (CDP)
- **puppeteer-core**: Direct CDP access library (already installed)
- **wdio-chromedriver-service**: Chrome browser driver (already configured)
- **Chrome remote debugging**: Enabled via `--remote-debugging-port=0` (already configured)

**Note**: This implementation uses puppeteer-core to connect directly to Chrome's debugging port, which allows it to work with WebDriverIO's multiremote mode (p1, p2, p3, p4 browser instances).

## Quick Start

### Running Tests with Network Capture

Enable network capture by setting the `CAPTURE_NETWORK=true` environment variable:

```bash
# Run all tests with network capture
npm run test-network

# Run single test with network capture
npm run test-network-single -- tests/specs/2way/audioOnlyTest.spec.ts

# Run development environment test with network capture
npm run test-network-dev-single -- tests/specs/2way/audioOnlyTest.spec.ts
```

### Output Files

Network capture data is saved to `test-results/` directory:

```
test-results/
├── network-p1-0-0-audioOnlyTest.json    # Participant 1 capture
├── network-p2-0-0-audioOnlyTest.json    # Participant 2 capture
└── ...
```

Each file contains:
- `captureDate`: Timestamp of capture
- `stats`: Summary statistics (total, succeeded, failed, by domain, etc.)
- `requests`: Array of all captured requests with details

### Analyzing Captured Data

Use the analysis utility to generate reports:

```bash
# Print summary to console
npm run analyze-network -- test-results/network-p1-0-0-audioOnlyTest.json

# Export unique URLs to text file
npm run analyze-network -- test-results/network-p1-0-0-audioOnlyTest.json --urls urls.txt

# Export all requests to CSV
npm run analyze-network -- test-results/network-p1-0-0-audioOnlyTest.json --csv requests.csv

# Export domain summary to JSON
npm run analyze-network -- test-results/network-p1-0-0-audioOnlyTest.json --domains domains.json

# Combine multiple exports
npm run analyze-network -- test-results/network-p1-0-0-audioOnlyTest.json \
  --urls urls.txt \
  --csv requests.csv \
  --domains domains.json
```

## Analysis Output

### Console Summary

The analysis tool prints a comprehensive summary:

```
=== Network Capture Analysis ===
Capture Date: 2025-11-06T10:30:00.000Z

--- Summary ---
Total Requests: 127
Succeeded: 124 (97.6%)
Failed: 3 (2.4%)
Cached: 15 (11.8%)

--- Requests by Domain (Top 10) ---
  localhost:8080: 45
  meet-jit-si-turnrelay.jitsi.net: 12
  alpha.jitsi.net: 8
  ...

--- Requests by Status Code ---
  200: 110
  304: 14
  404: 2
  Failed: 1

--- Requests by Resource Type ---
  Document: 2
  Script: 35
  XHR: 40
  WebSocket: 5
  ...

--- Failed Requests (3) ---
  [GET] https://example.com/missing.js
    Reason: net::ERR_CONNECTION_REFUSED
  ...
```

### Export Formats

**URLs Text File** (`--urls`)
```
https://localhost:8080/config.js
https://localhost:8080/lib-jitsi-meet.js
https://alpha.jitsi.net/http-bind
...
```

**CSV File** (`--csv`)
```csv
"URL","Method","Status","Success","ResourceType","FromCache","FailureText"
"https://localhost:8080/config.js","GET","200","true","Script","false",""
...
```

**Domain Summary JSON** (`--domains`)
```json
{
  "uniqueDomains": [
    "localhost:8080",
    "alpha.jitsi.net",
    "meet-jit-si-turnrelay.jitsi.net"
  ],
  "requestsByDomain": {
    "localhost:8080": 45,
    "alpha.jitsi.net": 8,
    ...
  }
}
```

## Use Cases

### 1. Verify URL Allowlist

Compare captured URLs against expected patterns:

```bash
npm run test-network-single -- tests/specs/2way/audioOnlyTest.spec.ts
npm run analyze-network -- test-results/network-p1-*.json --urls captured-urls.txt

# Compare with your allowlist
diff captured-urls.txt expected-urls.txt
```

### 2. Debug Network Failures

Identify failing requests during tests:

```bash
npm run test-network-dev-single -- tests/specs/failing-test.spec.ts
npm run analyze-network -- test-results/network-*.json
# Check "Failed Requests" section
```

### 3. Performance Analysis

Analyze request patterns and identify bottlenecks:

```bash
npm run analyze-network -- test-results/network-*.json --csv all-requests.csv
# Import CSV into spreadsheet for timing analysis
```

### 4. Validate CSP/CORS

Ensure all requests succeed and no CORS errors occur:

```bash
npm run test-network-single -- tests/specs/your-test.spec.ts
npm run analyze-network -- test-results/network-*.json
# Check for CORS-related failures
```

### 5. Compare URL Patterns Across Tests

Capture multiple tests and compare:

```bash
npm run test-network-single -- tests/specs/2way/audioOnlyTest.spec.ts
npm run test-network-single -- tests/specs/3way/test.spec.ts

npm run analyze-network -- test-results/network-p1-*-audioOnlyTest.json --urls audio-urls.txt
npm run analyze-network -- test-results/network-p1-*-test.json --urls 3way-urls.txt

diff audio-urls.txt 3way-urls.txt
```

## Programmatic Usage

### Using NetworkCapture in Custom Scripts

```typescript
import { NetworkCapture } from './tests/helpers/NetworkCapture';

// In your test or script
const capture = new NetworkCapture(browser);
await capture.start();

// ... perform actions ...

await capture.stop();

// Get statistics
const stats = capture.getStats();
console.log(`Total requests: ${stats.total}`);

// Get failed URLs
const failed = capture.getFailedUrls();
console.log('Failed:', failed);

// Export to file
capture.exportToJSON('my-capture.json');
```

### Using NetworkAnalyzer

```typescript
import { NetworkAnalyzer } from './tests/helpers/networkAnalysis';

const analyzer = new NetworkAnalyzer('test-results/network-p1-0-0-test.json');

// Get unique domains
const domains = analyzer.getUniqueDomains();

// Get failed requests
const failed = analyzer.getFailedRequests();

// Export reports
analyzer.printSummary();
analyzer.exportUrlsToFile('urls.txt');
analyzer.exportToCSV('requests.csv');
analyzer.exportDomainSummary('domains.json');
```

## Configuration

### Environment Variables

- **`CAPTURE_NETWORK=true`**: Enable network capture (required)
- **`GRID_NODE_HOSTNAME=<hostname>`**: Grid node hostname for remote testing (optional, see Grid Support below)
- Works with all WDIO configurations: `wdio.conf.ts`, `wdio.dev.conf.ts`, etc.

### Grid Support

The network capture feature supports both **local testing** (default) and **remote grid nodes**.

#### Local Testing (Default)

No configuration needed. Works out of the box:

```bash
CAPTURE_NETWORK=true npm run test-dev-single -- tests/specs/2way/audioOnlyTest.spec.ts
```

#### Grid Testing Configuration

**✨ Automatic Discovery (Recommended)**

For Selenium Grid 4 or Grid 3, node addresses are **automatically discovered**:

```bash
# Just set GRID_HOST_URL - nodes are discovered automatically!
CAPTURE_NETWORK=true GRID_HOST_URL=http://your-grid-hub:4444 npm run test-grid
```

The system will:
- Query Grid 4 GraphQL API (`/graphql`) to get node URI
- Fall back to Grid 3 REST API (`/grid/api/testsession`) if Grid 4 not available
- Extract hostname from node URI automatically

**Manual Configuration (Fallback)**

If automatic discovery fails or you want manual control:

**Option 1: Environment Variable (Simple - Single Node)**

Use when all tests run on the same grid node:

```bash
CAPTURE_NETWORK=true GRID_NODE_HOSTNAME=node-1.your-grid.com npm run test-grid-single -- tests/specs/2way/audioOnlyTest.spec.ts
```

**Option 2: Custom Capability (Advanced - Per-Browser)**

Use when you want to manually specify hostname per browser:

```javascript
// In your grid configuration or wdio.conf.ts:
capabilities: {
  browserName: 'chrome',
  'goog:chromeOptions': {
    args: ['--remote-debugging-port=0', '--remote-debugging-address=0.0.0.0']
  },
  'custom:nodeHostname': 'node-1.your-grid.com'  // Add this
}
```

**Priority Order:**
1. Custom capability `'custom:nodeHostname'` (highest priority - manual override)
2. **Automatic discovery via `GRID_HOST_URL`** (NEW - zero config for Grid 4/3)
3. Environment variable `GRID_NODE_HOSTNAME` (fallback)
4. Default: `localhost` (local testing)

#### Grid Node Requirements

For grid support, Chrome on nodes must be configured to expose debugging on the network:

```bash
# In your grid node Chrome configuration:
--remote-debugging-address=0.0.0.0  # Allow connections from network (not just localhost)
--remote-debugging-port=0           # Auto-assign port (already configured)
```

**Security Note:** Only expose debugging ports on trusted networks. Consider firewall rules or SSH tunneling for production grids.

#### Example Grid Setup

**Scenario:** Tests run on grid with 2 nodes

**Node Configuration:**
```yaml
# node-1.your-grid.com
chrome_args:
  - --remote-debugging-address=0.0.0.0
  - --remote-debugging-port=0

# node-2.your-grid.com
chrome_args:
  - --remote-debugging-address=0.0.0.0
  - --remote-debugging-port=0
```

**Test Execution:**
```bash
# If all tests run on node-1:
CAPTURE_NETWORK=true GRID_NODE_HOSTNAME=node-1.your-grid.com npm run test-grid

# If tests distribute across nodes, use custom capability in wdio.conf.ts
# (grid must set 'custom:nodeHostname' based on which node browser is on)
CAPTURE_NETWORK=true npm run test-grid
```

#### Verifying Grid Configuration

Check the console output when tests start:

```
✓ Local testing:
  NetworkCapture: Using local debugger address: localhost:65243

✓ Grid with automatic discovery (Grid 4):
  p1: Discovered running on grid node node-1.your-grid.com
  NetworkCapture: Using grid node hostname from capability: node-1.your-grid.com:65243

✓ Grid with automatic discovery (Grid 3):
  p1: Discovered running on grid node 172.18.0.3
  NetworkCapture: Using grid node hostname from capability: 172.18.0.3:65243

✓ Grid with env variable:
  NetworkCapture: Using grid node hostname from env: node-1.your-grid.com:65243

✓ Grid with custom capability:
  NetworkCapture: Using grid node hostname from capability: node-1.your-grid.com:65243
```

### Limitations

- **Chrome Only**: Network capture uses CDP, which is Chrome-specific. Firefox tests are automatically skipped.
- **Performance Overhead**: Minimal impact, but may add 1-2% to test execution time.
- **Storage**: Each test generates 100KB-5MB JSON files depending on number of requests.

## Troubleshooting

### Network capture not starting

**Symptom**: No `network-*.json` files created

**Solutions**:
1. Verify `CAPTURE_NETWORK=true` is set
2. Check browser is Chrome (not Firefox)
3. Look for errors in test output: "Failed to start network capture"
4. Ensure WebDriverIO config properly loads `NetworkCapture`

### CDP connection errors

**Symptom**: "Error: Protocol error: Connection closed"

**Solutions**:
1. Ensure Chrome/chromedriver versions are compatible
2. Check if Chrome crashed during test (screenshot in test-results/)
3. Try running with headful mode (remove `HEADLESS=true`)

### Large file sizes

**Symptom**: JSON files are unexpectedly large (>10MB)

**Solutions**:
1. Long-running tests capture more requests
2. Consider filtering out noise (e.g., keep-alive pings, polling)
3. Break test into smaller test cases

### Missing requests

**Symptom**: Expected URLs not in capture

**Possible causes**:
1. Requests completed before capture started (start earlier in test)
2. Requests made from service worker (not intercepted by CDP)
3. WebRTC data channels (not HTTP requests)
4. Browser cache prevented request (check `fromCache` field)

## Architecture

### NetworkCapture Class

Located in `tests/helpers/NetworkCapture.ts`

- Uses puppeteer-core to connect directly to Chrome's debugging port
- Works with WebDriverIO multiremote mode (multiple browser instances)
- Enables CDP Network domain via CDPSession
- Listens to CDP events:
  - `Network.requestWillBeSent` - captures outgoing requests
  - `Network.responseReceived` - captures responses
  - `Network.loadingFailed` - captures failures
- Stores data in memory, exports on demand

**Why Puppeteer instead of @wdio/devtools-service?**
The @wdio/devtools-service does not support multiremote mode (GitHub issue #5505 since 2020). Using puppeteer-core allows us to establish individual CDP connections for each browser instance (p1, p2, p3, p4).

### WDIO Integration

Located in `tests/wdio.conf.ts`

- **before hook**: Initializes NetworkCapture when `CAPTURE_NETWORK=true`
- **after hook**: Stops capture and exports JSON files
- Creates separate capture instance for each browser (p1, p2, p3, p4)

### NetworkAnalyzer Class

Located in `tests/helpers/networkAnalysis.ts`

- Parses JSON capture files
- Generates statistics and reports
- Exports to multiple formats
- CLI entry point for analysis commands

## Future Enhancements

Potential additions:

- **HAR Export**: Full HTTP Archive format support
- **Request/Response Bodies**: Optional capture of payload data
- **Real-time Filtering**: Exclude domains/patterns during capture
- **Automatic Comparison**: Built-in diff against `COMPREHENSIVE-URL-LIST.md`
- **HTML Reports**: Visual charts and graphs
- **WebDriver Bidi**: Cross-browser support when standardized

## Related Documentation

- [COMPREHENSIVE-URL-LIST.md](../COMPREHENSIVE-URL-LIST.md) - Complete list of possible URLs
- [WebDriverIO CDP Docs](https://webdriver.io/docs/api/chromium/#cdp) - CDP API reference
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) - CDP specification
