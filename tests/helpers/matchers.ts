import { expect } from '@wdio/globals';

expect.extend({
    toPartiallyMatch(received: string, other: string, receivedLabel = 'received', otherLabel = 'other') {
        const pass = received.includes(other) || other.includes(received);

        return {
            pass,
            message: () => pass
                ? `Expected ${receivedLabel} NOT to partially match ${otherLabel}.\n  ${receivedLabel}: "${received}"\n  ${otherLabel}: "${other}"`
                : `Expected ${receivedLabel} to partially match ${otherLabel} (one should contain the other).\n  ${receivedLabel}: "${received}"\n  ${otherLabel}: "${other}"`
        };
    },

    toStartWith(received: string, prefix: string, label = 'value') {
        const pass = received.startsWith(prefix);

        return {
            pass,
            message: () => pass
                ? `Expected ${label} NOT to start with "${prefix}".\n  ${label}: "${received}"`
                : `Expected ${label} to start with "${prefix}".\n  ${label}: "${received}"`
        };
    },

    toBeInteger(received: unknown, label = 'value') {
        const pass = Number.isInteger(received);

        return {
            pass,
            message: () => pass
                ? `Expected ${label} NOT to be an integer.\n  ${label}: ${JSON.stringify(received)}`
                : `Expected ${label} to be an integer.\n  ${label}: ${JSON.stringify(received)}`
        };
    }
});

declare module 'expect' {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Matchers<R> {
        toBeInteger: (label?: string) => R;
        toPartiallyMatch: (other: string, receivedLabel?: string, otherLabel?: string) => R;
        toStartWith: (prefix: string, label?: string) => R;
    }
}
