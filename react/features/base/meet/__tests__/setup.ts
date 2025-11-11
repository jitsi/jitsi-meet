import { vi } from 'vitest';

vi.mock("@openpgp/web-stream-tools", () => ({
    concatUint8Array: vi.fn((arr) => arr),
    concat: vi.fn(async (streams) => new Uint8Array()),
    stream: {
        transform: vi.fn((data, fn) => data),
        readToEnd: vi.fn(async () => new Uint8Array()),
        slice: vi.fn((stream, begin, end) => stream),
    },
    Reader: vi.fn(),
    Writer: vi.fn(),
}));


vi.mock('openpgp/dist/openpgp.js', () => ({
    default: {},
}));


vi.mock("openpgp", () => ({
    default: {
        readKey: vi.fn(),
        readPrivateKey: vi.fn(),
        readMessage: vi.fn(),
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        generateKey: vi.fn(),
        Key: {
            fromPublic: vi.fn(),
            fromPrivate: vi.fn(),
        },
    },
    readKey: vi.fn(),
    readPrivateKey: vi.fn(),
    readMessage: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    generateKey: vi.fn(),
}));


vi.stubGlobal('crypto', {
    getRandomValues: vi.fn(),
    subtle: {
        digest: vi.fn(),
        importKey: vi.fn(),
        exportKey: vi.fn(),
        sign: vi.fn(),
        verify: vi.fn(),
        encrypt: vi.fn(),
        decrypt: vi.fn()
    }
});