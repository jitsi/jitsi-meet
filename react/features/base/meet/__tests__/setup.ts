import { vi } from 'vitest';

// Mock OpenPGP
vi.mock('openpgp', () => ({
    default: {
        readKey: vi.fn(),
        readPrivateKey: vi.fn(),
        readMessage: vi.fn(),
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        generateKey: vi.fn(),
        Key: {
            fromPublic: vi.fn(),
            fromPrivate: vi.fn()
        }
    }
}));

// Mock Web Stream Tools
vi.mock('@openpgp/web-stream-tools', () => ({
    concatUint8Array: vi.fn(),
    stream: {
        transform: vi.fn()
    }
}));

// Mock Web Crypto API
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