# Network Capture Grid Setup Guide

Quick reference for configuring network capture with Selenium/WebDriver grid.

## TL;DR

**Local testing (default):** No configuration needed ✓

**Grid testing:** Set `GRID_NODE_HOSTNAME` environment variable or `custom:nodeHostname` capability

---

## Configuration Matrix

| Scenario | Configuration | Command Example |
|----------|---------------|-----------------|
| **Local testing** | None (default) | `CAPTURE_NETWORK=true npm run test-dev-single -- tests/specs/2way/audioOnlyTest.spec.ts` |
| **Grid - Single node** | `GRID_NODE_HOSTNAME=node-1.grid.com` | `CAPTURE_NETWORK=true GRID_NODE_HOSTNAME=node-1.grid.com npm run test-grid` |
| **Grid - Multiple nodes** | Custom capability `'custom:nodeHostname'` | See below |

---

## Setup Steps for Grid

### Step 1: Configure Chrome on Grid Nodes

Add these Chrome arguments on ALL grid nodes:

```bash
--remote-debugging-address=0.0.0.0  # Expose debugging on network (not just localhost)
--remote-debugging-port=0           # Auto-assign available port
```

**Example Selenium Grid node config:**
```json
{
  "capabilities": [{
    "browserName": "chrome",
    "goog:chromeOptions": {
      "args": [
        "--remote-debugging-address=0.0.0.0",
        "--remote-debugging-port=0"
      ]
    }
  }]
}
```

### Step 2: Choose Configuration Method

#### Method A: Environment Variable (Simple)

Use when all tests run on the same node:

```bash
export GRID_NODE_HOSTNAME=node-1.your-grid.com
CAPTURE_NETWORK=true npm run test-grid
```

#### Method B: Custom Capability (Advanced)

Use when tests run on different nodes. Your grid hub/router must set the capability based on which node the browser is assigned to.

**In your grid hub logic** (pseudocode):
```javascript
// When assigning browser to a node:
if (assignedToNode === 'node-1.your-grid.com') {
  capabilities['custom:nodeHostname'] = 'node-1.your-grid.com';
} else if (assignedToNode === 'node-2.your-grid.com') {
  capabilities['custom:nodeHostname'] = 'node-2.your-grid.com';
}
```

**Or in wdio.conf.ts** (if node is known at config time):
```typescript
capabilities: {
  browserName: 'chrome',
  'custom:nodeHostname': process.env.NODE_HOSTNAME || 'node-1.your-grid.com'
}
```

---

## Verification

When tests start, check console output:

```
✓ Local:      NetworkCapture: Using local debugger address: localhost:65243
✓ Grid (env): NetworkCapture: Using grid node hostname from env: node-1.grid.com:65243
✓ Grid (cap): NetworkCapture: Using grid node hostname from capability: node-1.grid.com:65243
```

If you see connection errors, the hostname/port is wrong or Chrome isn't exposing debugging on the network.

---

## Security Considerations

**⚠️ IMPORTANT:** Exposing Chrome's debugging port on `0.0.0.0` allows anyone on the network to connect and control the browser.

**Recommended security measures:**

1. **Firewall rules:** Only allow connections from test runner IPs
   ```bash
   # Example iptables rule on grid node:
   iptables -A INPUT -p tcp --dport 9222:9322 -s 10.0.1.100 -j ACCEPT
   iptables -A INPUT -p tcp --dport 9222:9322 -j DROP
   ```

2. **VPN/Private network:** Run grid on isolated network

3. **SSH tunneling:** Tunnel debugging ports through SSH
   ```bash
   # On test runner machine:
   ssh -L 9222:localhost:9222 node-1.your-grid.com
   # Then use GRID_NODE_HOSTNAME=localhost in tests
   ```

4. **Temporary exposure:** Only enable debugging when running network capture tests

---

## Troubleshooting

### Error: "Chrome debugger address not found in capabilities"

**Cause:** Chrome didn't start with `--remote-debugging-port`

**Fix:** Ensure Chrome args include `--remote-debugging-port=0` (should already be in wdio.conf.ts)

### Error: "Failed to fetch debugger info: 404" or "ECONNREFUSED"

**Cause:** NetworkCapture can't reach Chrome's debugging port

**Possible fixes:**
1. Check `GRID_NODE_HOSTNAME` matches actual node hostname
2. Verify Chrome is running with `--remote-debugging-address=0.0.0.0`
3. Check firewall allows connections to debugging port
4. Test manually: `curl http://node-1.your-grid.com:9222/json/version`

### Error: "webSocketDebuggerUrl not found"

**Cause:** Chrome's debugging endpoint isn't responding correctly

**Fix:**
1. Verify Chrome version supports remote debugging
2. Check Chrome didn't crash during startup
3. Try restarting the grid node

### Tests work locally but fail on grid

**Cause:** Forgot to set `GRID_NODE_HOSTNAME` or `custom:nodeHostname`

**Fix:** Add grid configuration (see Step 2 above)

---

## Priority Order (for reference)

When resolving the debugger address, NetworkCapture checks in this order:

1. **Custom capability** `'custom:nodeHostname'` ← Highest priority
2. **Environment variable** `GRID_NODE_HOSTNAME`
3. **Default** Use debuggerAddress as-is (localhost) ← Local testing

This allows you to:
- Use env var for simple setups
- Override per-browser with capability for complex setups
- No config needed for local development

---

## Example: Real Grid Setup

**Infrastructure:**
- Grid hub: `grid-hub.company.com`
- Node 1: `chrome-node-1.company.com`
- Node 2: `chrome-node-2.company.com`
- Test runner: `test-runner.company.com`

**Node configuration (both nodes):**
```bash
# Chrome startup args:
--remote-debugging-address=0.0.0.0
--remote-debugging-port=0

# Firewall (allow test runner only):
iptables -A INPUT -p tcp --dport 9222:9322 -s test-runner.company.com -j ACCEPT
iptables -A INPUT -p tcp --dport 9222:9322 -j DROP
```

**Test execution:**
```bash
# On test-runner.company.com
# Tests will be distributed across both nodes
export GRID_NODE_HOSTNAME=chrome-node-1.company.com  # If all tests go to node 1
# OR configure custom:nodeHostname capability in grid hub
CAPTURE_NETWORK=true npm run test-grid
```

---

## Questions?

- See full documentation: `tests/NETWORK-CAPTURE.md`
- Check implementation: `tests/helpers/NetworkCapture.ts`
- Grid configuration: Your grid provider's documentation
