import '../../__tests__/setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CryptoService } from '../crypto.service';
import { ConfigService } from '../config.service';
import { KeysService } from '../keys.service';

vi.mock('../config.service');
vi.mock('../keys.service');

describe('CryptoService', () => {
    const mockConfigService = {
        get: vi.fn().mockReturnValue('test-secret')
    };

    const mockKeysService = {
        generateNewKeysWithEncrypted: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (ConfigService as any).instance = mockConfigService;
        (KeysService as any).instance = mockKeysService;
    });

    describe('Password hashing', () => {
        it('When generating a hash without salt, then a new salt is generated and hash is created', () => {
            const password = 'test-password';
            const result = CryptoService.instance.passToHash({ password });

            expect(result.salt).toBeDefined();
            expect(result.hash).toBeDefined();
            expect(result.salt.length).toBe(32); // 128/8 = 16 bytes = 32 hex chars
            expect(result.hash.length).toBe(64); // 256/8 = 32 bytes = 64 hex chars
        });

        it('When generating a hash with provided salt, then the provided salt is used', () => {
            const password = 'test-password';
            const salt = 'test-salt';
            const result = CryptoService.instance.passToHash({ password, salt });

            expect(result.salt).toBe(salt);
            expect(result.hash).toBeDefined();
        });
    });

    describe('Text encryption and decryption', () => {
        it('When encrypting text, then the encrypted text can be decrypted back', () => {
            const originalText = 'test-text';
            const encrypted = CryptoService.instance.encryptText(originalText);
            const decrypted = CryptoService.instance.decryptText(encrypted);

            expect(encrypted).not.toBe(originalText);
            expect(decrypted).toBe(originalText);
        });

        it('When encrypting text with a specific key, then the encrypted text can be decrypted with the same key', () => {
            const originalText = 'test-text';
            const key = 'test-key';
            const encrypted = CryptoService.instance.encryptTextWithKey(originalText, key);
            const decrypted = CryptoService.instance.decryptTextWithKey(encrypted, key);

            expect(encrypted).not.toBe(originalText);
            expect(decrypted).toBe(originalText);
        });
    });

    describe('Key generation', () => {
        it('When generating keys, then the crypto provider returns the expected structure', async () => {
            const mockKeys = {
                privateKeyArmoredEncrypted: 'encrypted-private',
                publicKeyArmored: 'public',
                revocationCertificate: 'revocation'
            };

            mockKeysService.generateNewKeysWithEncrypted.mockResolvedValue(mockKeys);

            const password = 'test-password';
            const keys = await CryptoService.cryptoProvider.generateKeys(password);

            expect(keys).toEqual({
                privateKeyEncrypted: mockKeys.privateKeyArmoredEncrypted,
                publicKey: mockKeys.publicKeyArmored,
                revocationCertificate: mockKeys.revocationCertificate,
                ecc: {
                    publicKey: mockKeys.publicKeyArmored,
                    privateKeyEncrypted: mockKeys.privateKeyArmoredEncrypted
                },
                kyber: {
                    publicKey: null,
                    privateKeyEncrypted: null
                }
            });
        });
    });

    describe('Password hash encryption', () => {
        it('When encrypting password hash, then the crypto provider uses the correct process', () => {
            const password = 'test-password';
            const encryptedSalt = 'encrypted-salt';
            const decryptedSalt = 'decrypted-salt';
            const hash = 'test-hash';

            vi.spyOn(CryptoService.instance, 'decryptText').mockReturnValue(decryptedSalt);
            vi.spyOn(CryptoService.instance, 'passToHash').mockReturnValue({ salt: decryptedSalt, hash });
            vi.spyOn(CryptoService.instance, 'encryptText').mockReturnValue('encrypted-hash');

            const result = CryptoService.cryptoProvider.encryptPasswordHash(password, encryptedSalt);

            expect(CryptoService.instance.decryptText).toHaveBeenCalledWith(encryptedSalt);
            expect(CryptoService.instance.passToHash).toHaveBeenCalledWith({ password, salt: decryptedSalt });
            expect(CryptoService.instance.encryptText).toHaveBeenCalledWith(hash);
            expect(result).toBe('encrypted-hash');
        });
    });
});