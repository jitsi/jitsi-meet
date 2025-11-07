#!/usr/bin/env node

import * as fs from 'fs';

/**
 * Represents a captured network request from the NetworkCapture output.
 */
interface INetworkRequest {
    failureText?: string;
    fromCache?: boolean;
    method: string;
    requestId: string;
    resourceType?: string;
    status?: number;
    success?: boolean;
    timestamp: number;
    url: string;
}

/**
 * Statistics about captured network requests.
 */
interface INetworkStats {
    byDomain: Record<string, number>;
    byResourceType: Record<string, number>;
    byStatus: Record<number, number>;
    cachedRequests: number;
    failed: number;
    succeeded: number;
    total: number;
}

/**
 * Network capture data structure.
 */
interface ICaptureData {
    captureDate: string;
    requests: INetworkRequest[];
    stats: INetworkStats;
}

/**
 * Analyzes network capture data and generates reports.
 */
export class NetworkAnalyzer {
    private data: ICaptureData;

    /**
     * Creates a new NetworkAnalyzer from a JSON file.
     *
     * @param {string} jsonFilePath - Path to the network capture JSON file.
     */
    constructor(jsonFilePath: string) {
        if (!fs.existsSync(jsonFilePath)) {
            throw new Error(`File not found: ${jsonFilePath}`);
        }

        const content = fs.readFileSync(jsonFilePath, 'utf-8');

        this.data = JSON.parse(content);
    }

    /**
     * Returns all unique URLs from the capture.
     *
     * @returns {string[]} Array of unique URLs.
     */
    getUniqueUrls(): string[] {
        const urls = new Set(this.data.requests.map(req => req.url));

        return Array.from(urls).sort();
    }

    /**
     * Returns all unique domains from the capture.
     *
     * @returns {string[]} Array of unique domains.
     */
    getUniqueDomains(): string[] {
        const domains = new Set<string>();

        for (const request of this.data.requests) {
            try {
                const url = new URL(request.url);

                domains.add(url.hostname);
            } catch (e) {
                // Skip invalid URLs
            }
        }

        return Array.from(domains).sort();
    }

    /**
     * Returns requests grouped by domain.
     *
     * @returns {Record<string, INetworkRequest[]>} Requests grouped by domain.
     */
    getRequestsByDomain(): Record<string, INetworkRequest[]> {
        const byDomain: Record<string, INetworkRequest[]> = {};

        for (const request of this.data.requests) {
            try {
                const url = new URL(request.url);
                const domain = url.hostname;

                if (!byDomain[domain]) {
                    byDomain[domain] = [];
                }
                byDomain[domain].push(request);
            } catch (e) {
                // Skip invalid URLs
            }
        }

        return byDomain;
    }

    /**
     * Returns failed requests with details.
     *
     * @returns {INetworkRequest[]} Array of failed requests.
     */
    getFailedRequests(): INetworkRequest[] {
        return this.data.requests.filter(req => req.success === false);
    }

    /**
     * Returns requests by HTTP status code.
     *
     * @returns {Record<number, INetworkRequest[]>} Requests grouped by status code.
     */
    getRequestsByStatus(): Record<number, INetworkRequest[]> {
        const byStatus: Record<number, INetworkRequest[]> = {};

        for (const request of this.data.requests) {
            if (request.status) {
                if (!byStatus[request.status]) {
                    byStatus[request.status] = [];
                }
                byStatus[request.status].push(request);
            }
        }

        return byStatus;
    }

    /**
     * Returns requests by resource type.
     *
     * @returns {Record<string, INetworkRequest[]>} Requests grouped by resource type.
     */
    getRequestsByResourceType(): Record<string, INetworkRequest[]> {
        const byType: Record<string, INetworkRequest[]> = {};

        for (const request of this.data.requests) {
            if (request.resourceType) {
                if (!byType[request.resourceType]) {
                    byType[request.resourceType] = [];
                }
                byType[request.resourceType].push(request);
            }
        }

        return byType;
    }

    /**
     * Prints a summary report to console.
     */
    printSummary(): void {
        console.log('\n=== Network Capture Analysis ===');
        console.log(`Capture Date: ${this.data.captureDate}`);
        console.log('\n--- Summary ---');
        console.log(`Total Requests: ${this.data.stats.total}`);
        console.log(`Succeeded: ${this.data.stats.succeeded} (${this.getPercentage(this.data.stats.succeeded, this.data.stats.total)}%)`);
        console.log(`Failed: ${this.data.stats.failed} (${this.getPercentage(this.data.stats.failed, this.data.stats.total)}%)`);
        console.log(`Cached: ${this.data.stats.cachedRequests} (${this.getPercentage(this.data.stats.cachedRequests, this.data.stats.total)}%)`);

        console.log('\n--- Requests by Domain (Top 10) ---');
        const domainEntries = Object.entries(this.data.stats.byDomain)
            .sort(([ , a ], [ , b ]) => b - a)
            .slice(0, 10);

        for (const [ domain, count ] of domainEntries) {
            console.log(`  ${domain}: ${count}`);
        }

        console.log('\n--- Requests by Status Code ---');
        const statusEntries = Object.entries(this.data.stats.byStatus)
            .sort(([ a ], [ b ]) => parseInt(a) - parseInt(b));

        for (const [ status, count ] of statusEntries) {
            console.log(`  ${status}: ${count}`);
        }

        console.log('\n--- Requests by Resource Type ---');
        const typeEntries = Object.entries(this.data.stats.byResourceType)
            .sort(([ , a ], [ , b ]) => b - a);

        for (const [ type, count ] of typeEntries) {
            console.log(`  ${type}: ${count}`);
        }

        const failedRequests = this.getFailedRequests();

        if (failedRequests.length > 0) {
            console.log(`\n--- Failed Requests (${failedRequests.length}) ---`);
            for (const request of failedRequests) {
                console.log(`  [${request.method}] ${request.url}`);
                if (request.failureText) {
                    console.log(`    Reason: ${request.failureText}`);
                }
            }
        }

        console.log('\n');
    }

    /**
     * Exports unique URLs to a text file (one per line).
     *
     * @param {string} outputPath - Path where to save the file.
     */
    exportUrlsToFile(outputPath: string): void {
        const urls = this.getUniqueUrls();

        fs.writeFileSync(outputPath, urls.join('\n'));
        console.log(`Exported ${urls.length} unique URLs to ${outputPath}`);
    }

    /**
     * Exports analysis to CSV format.
     *
     * @param {string} outputPath - Path where to save the CSV file.
     */
    exportToCSV(outputPath: string): void {
        const headers = [ 'URL', 'Method', 'Status', 'Success', 'ResourceType', 'FromCache', 'FailureText' ];
        const rows = [ headers ];

        for (const request of this.data.requests) {
            rows.push([
                request.url,
                request.method,
                request.status?.toString() || '',
                request.success?.toString() || '',
                request.resourceType || '',
                request.fromCache?.toString() || '',
                request.failureText || ''
            ]);
        }

        const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        fs.writeFileSync(outputPath, csvContent);
        console.log(`Exported ${this.data.requests.length} requests to ${outputPath}`);
    }

    /**
     * Exports domain summary to JSON.
     *
     * @param {string} outputPath - Path where to save the JSON file.
     */
    exportDomainSummary(outputPath: string): void {
        const summary = {
            uniqueDomains: this.getUniqueDomains(),
            requestsByDomain: Object.fromEntries(
                Object.entries(this.data.stats.byDomain)
                    .sort(([ , a ], [ , b ]) => b - a)
            )
        };

        fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
        console.log(`Exported domain summary to ${outputPath}`);
    }

    /**
     * Helper method to calculate percentage.
     *
     * @param {number} value - The value.
     * @param {number} total - The total.
     * @returns {string} Percentage formatted to 1 decimal place.
     */
    private getPercentage(value: number, total: number): string {
        if (total === 0) {
            return '0.0';
        }

        return ((value / total) * 100).toFixed(1);
    }
}

/**
 * CLI entry point for network analysis.
 */
function main(): void {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Usage: networkAnalysis.ts <network-capture.json> [options]');
        console.error('\nOptions:');
        console.error('  --urls <file>        Export unique URLs to text file');
        console.error('  --csv <file>         Export requests to CSV file');
        console.error('  --domains <file>     Export domain summary to JSON file');
        console.error('\nExample:');
        console.error('  npx tsx tests/helpers/networkAnalysis.ts test-results/network-p1-0-0-audioOnlyTest.json');
        console.error('  npx tsx tests/helpers/networkAnalysis.ts test-results/network-p1-0-0-audioOnlyTest.json --urls urls.txt --csv requests.csv');
        process.exit(1);
    }

    const jsonFilePath = args[0];
    const analyzer = new NetworkAnalyzer(jsonFilePath);

    // Print summary to console
    analyzer.printSummary();

    // Handle optional exports
    for (let i = 1; i < args.length; i += 2) {
        const option = args[i];
        const outputPath = args[i + 1];

        if (!outputPath) {
            console.error(`Missing output path for option ${option}`);
            process.exit(1);
        }

        switch (option) {
        case '--urls':
            analyzer.exportUrlsToFile(outputPath);
            break;
        case '--csv':
            analyzer.exportToCSV(outputPath);
            break;
        case '--domains':
            analyzer.exportDomainSummary(outputPath);
            break;
        default:
            console.error(`Unknown option: ${option}`);
            process.exit(1);
        }
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}
