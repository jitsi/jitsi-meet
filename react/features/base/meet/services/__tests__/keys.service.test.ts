import * as aesModule from "@internxt/lib";
import { DecryptMessageResult, WebStream } from "openpgp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as pgpService from "../crypto/pgp.service";
import { KeysService } from "../keys.service";
import {
    BadEncodedPrivateKeyError,
    CorruptedEncryptedPrivateKeyError,
    KeysDoNotMatchError,
    WrongIterationsToEncryptPrivateKeyError,
} from "../types/keys.types";
import * as cryptoUtils from "../utils/crypto.utils";

vi.mock("@internxt/lib", () => ({
    aes: {
        encrypt: vi.fn().mockImplementation((data, password) => `encrypted-${data}-with-${password}`),
        decrypt: vi.fn().mockImplementation((data, password, iterations) => {
            if (iterations === 9999) throw new Error("Wrong iterations");

            if (data.startsWith("corrupted")) {
                throw new Error("Decryption failed");
            }

            if (data.startsWith("encrypted-")) {
                return data.replace("encrypted-", "").split("-with-")[0];
            }

            return `decrypted-${data}`;
        }),
    },
}));

vi.mock("../utils/crypto.utils", () => ({
    CryptoUtils: {
        getAesInit: vi.fn().mockReturnValue({ iv: "test-iv", salt: "test-salt" }),
    },
}));

vi.mock("../crypto/pgp.service", () => ({
    generateNewKeys: vi.fn().mockResolvedValue({
        privateKeyArmored: "test-private-key",
        publicKeyArmored: "test-public-key",
        revocationCertificate: "test-revocation-cert",
        publicKyberKeyBase64: "test-kyber-public-key",
        privateKyberKeyBase64: "test-kyber-private-key",
    }),
    getOpenpgp: vi.fn().mockResolvedValue({
        readKey: vi.fn().mockResolvedValue("mocked-public-key-object"),
        readPrivateKey: vi.fn().mockResolvedValue("mocked-private-key-object"),
        createMessage: vi.fn().mockResolvedValue("mocked-message-object"),
        readMessage: vi.fn().mockResolvedValue("mocked-encrypted-message"),
        encrypt: vi.fn().mockResolvedValue("mocked-encrypted-data"),
        decrypt: vi.fn().mockImplementation(async ({ message, decryptionKeys }) => {
            if (message === "mocked-encrypted-message" && decryptionKeys === "mocked-private-key-object") {
                return { data: "validate-keys" };
            }
            return { data: "invalid-message" };
        }),
    }),
}));

vi.mock("openpgp", () => ({
    readKey: vi.fn().mockImplementation(async ({ armoredKey }) => {
        if (armoredKey === "valid-key" || armoredKey === "test-public-key") {
            return "valid-key-object";
        }
        throw new Error("Invalid key");
    }),
    readPrivateKey: vi.fn(),
    createMessage: vi.fn(),
    readMessage: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    generateKey: vi.fn().mockResolvedValue({
        privateKey: "generated-private-key",
        publicKey: "generated-public-key",
        revocationCertificate: "generated-revocation-cert",
    }),
}));

describe("KeysService", () => {
    const mockPassword = "test-password";
    let keysService: KeysService;

    beforeEach(() => {
        vi.clearAllMocks();
        keysService = new KeysService();
    });

    describe("getKeys", () => {
        it("should generate and encrypt keys with correct format", async () => {
            const result = await keysService.getKeys(mockPassword);

            expect(pgpService.generateNewKeys).toHaveBeenCalled();
            expect(cryptoUtils.CryptoUtils.getAesInit).toHaveBeenCalled();
            expect(aesModule.aes.encrypt).toHaveBeenCalledWith(
                "test-private-key",
                mockPassword,
                cryptoUtils.CryptoUtils.getAesInit()
            );
            expect(aesModule.aes.encrypt).toHaveBeenCalledWith(
                "test-kyber-private-key",
                mockPassword,
                cryptoUtils.CryptoUtils.getAesInit()
            );

            expect(result).toEqual({
                privateKeyEncrypted: `encrypted-test-private-key-with-${mockPassword}`,
                publicKey: "test-public-key",
                revocationCertificate: "test-revocation-cert",
                ecc: {
                    privateKeyEncrypted: `encrypted-test-private-key-with-${mockPassword}`,
                    publicKey: "test-public-key",
                },
                kyber: {
                    publicKey: "test-kyber-public-key",
                    privateKeyEncrypted: `encrypted-test-kyber-private-key-with-${mockPassword}`,
                },
            });
        });
    });

    describe("parseAndDecryptUserKeys", () => {
        it("should correctly parse and decrypt user keys with both ECC and Kyber keys", () => {
            const decryptSpy = vi.spyOn(keysService, "decryptPrivateKey");

            const privateKey = "test-private-key";
            const kyberPrivateKey = "test-kyber-private-key";

            decryptSpy.mockReturnValueOnce(privateKey);
            decryptSpy.mockReturnValueOnce(kyberPrivateKey);

            const mockUserSettings = {
                privateKey: "encrypted-private-key",
                publicKey: "legacy-public-key",
                keys: {
                    ecc: {
                        publicKey: "test-public-key",
                        privateKey: "encrypted-ecc-private-key",
                    },
                    kyber: {
                        publicKey: "test-kyber-public-key",
                        privateKey: "encrypted-kyber-private-key",
                    },
                },
            } as any;

            const result = keysService.parseAndDecryptUserKeys(mockUserSettings, mockPassword);

            expect(decryptSpy).toHaveBeenCalledWith("encrypted-private-key", mockPassword);
            expect(decryptSpy).toHaveBeenCalledWith("encrypted-kyber-private-key", mockPassword);

            expect(result).toEqual({
                publicKey: "test-public-key",
                privateKey: Buffer.from(privateKey).toString("base64"),
                publicKyberKey: "test-kyber-public-key",
                privateKyberKey: kyberPrivateKey,
            });

            decryptSpy.mockRestore();
        });

        it("should correctly parse and decrypt user keys with only ECC keys", () => {
            const decryptSpy = vi.spyOn(keysService, "decryptPrivateKey");
            decryptSpy.mockReturnValueOnce("test-private-key");

            const mockUserSettings = {
                privateKey: "encrypted-private-key",
                publicKey: "legacy-public-key",
                keys: {
                    ecc: {
                        publicKey: "test-public-key",
                        privateKey: "encrypted-ecc-private-key",
                    },
                },
            } as any;

            const result = keysService.parseAndDecryptUserKeys(mockUserSettings, mockPassword);

            expect(decryptSpy).toHaveBeenCalledWith("encrypted-private-key", mockPassword);

            expect(result).toEqual({
                publicKey: "test-public-key",
                privateKey: Buffer.from("test-private-key").toString("base64"),
                publicKyberKey: "",
                privateKyberKey: "",
            });

            decryptSpy.mockRestore();
        });

        it("should correctly parse and decrypt user keys with only legacy keys", () => {
            const decryptSpy = vi.spyOn(keysService, "decryptPrivateKey");
            decryptSpy.mockReturnValueOnce("test-private-key");

            const mockUserSettings = {
                privateKey: "encrypted-private-key",
                publicKey: "legacy-public-key",
            } as any;

            const result = keysService.parseAndDecryptUserKeys(mockUserSettings, mockPassword);

            expect(decryptSpy).toHaveBeenCalledWith("encrypted-private-key", mockPassword);

            expect(result).toEqual({
                publicKey: "legacy-public-key",
                privateKey: Buffer.from("test-private-key").toString("base64"),
                publicKyberKey: "",
                privateKyberKey: "",
            });

            decryptSpy.mockRestore();
        });

        it("should handle empty private key", () => {
            const mockUserSettings = {
                privateKey: "",
                publicKey: "legacy-public-key",
            } as any;

            const result = keysService.parseAndDecryptUserKeys(mockUserSettings, mockPassword);

            expect(result.privateKey).toBe("");
        });
    });

    describe("encryptPrivateKey", () => {
        it("should encrypt private key using AES with correct parameters", () => {
            const plainPrivateKey = "plain-private-key";
            const result = keysService.encryptPrivateKey(plainPrivateKey, mockPassword);

            expect(cryptoUtils.CryptoUtils.getAesInit).toHaveBeenCalled();
            expect(aesModule.aes.encrypt).toHaveBeenCalledWith(
                plainPrivateKey,
                mockPassword,
                cryptoUtils.CryptoUtils.getAesInit()
            );
            expect(result).toBe(`encrypted-${plainPrivateKey}-with-${mockPassword}`);
        });
    });

    describe("decryptPrivateKey", () => {
        it("should return empty string for empty or too short keys", () => {
            const originalMinLength = keysService.MINIMAL_ENCRYPTED_KEY_LEN;
            Object.defineProperty(keysService, "MINIMAL_ENCRYPTED_KEY_LEN", { value: 10 });

            expect(keysService.decryptPrivateKey("", mockPassword)).toBe("");
            expect(keysService.decryptPrivateKey("short", mockPassword)).toBe("");

            Object.defineProperty(keysService, "MINIMAL_ENCRYPTED_KEY_LEN", { value: originalMinLength });
            expect(aesModule.aes.decrypt).not.toHaveBeenCalled();
        });

        it("should decrypt valid private key", () => {
            const originalMinLength = keysService.MINIMAL_ENCRYPTED_KEY_LEN;
            Object.defineProperty(keysService, "MINIMAL_ENCRYPTED_KEY_LEN", { value: 10 });

            const encryptedKey = `encrypted-test-private-key-with-${mockPassword}`;

            const result = keysService.decryptPrivateKey(encryptedKey, mockPassword);

            expect(aesModule.aes.decrypt).toHaveBeenCalledWith(encryptedKey, mockPassword);
            expect(result).toBe("test-private-key");

            Object.defineProperty(keysService, "MINIMAL_ENCRYPTED_KEY_LEN", { value: originalMinLength });
        });

        it("should throw CorruptedEncryptedPrivateKeyError when decryption fails", () => {
            const originalMinLength = keysService.MINIMAL_ENCRYPTED_KEY_LEN;
            Object.defineProperty(keysService, "MINIMAL_ENCRYPTED_KEY_LEN", { value: 10 });

            const corruptedKey = "corrupted-key".padEnd(150, "x");

            expect(() => keysService.decryptPrivateKey(corruptedKey, mockPassword)).toThrow(
                CorruptedEncryptedPrivateKeyError
            );

            Object.defineProperty(keysService, "MINIMAL_ENCRYPTED_KEY_LEN", { value: originalMinLength });
        });
    });

    describe("assertPrivateKeyIsValid", () => {
        it("should throw WrongIterationsToEncryptPrivateKeyError when key was encrypted with wrong iterations", async () => {
            vi.mocked(aesModule.aes.decrypt).mockImplementationOnce((data, password, iterations) => {
                if (iterations === 9999) return "some-value";
                throw new Error("Should not reach here");
            });

            await expect(keysService.assertPrivateKeyIsValid("valid-key", mockPassword)).rejects.toThrow(
                WrongIterationsToEncryptPrivateKeyError
            );

            expect(aesModule.aes.decrypt).toHaveBeenCalledWith("valid-key", mockPassword, 9999);
        });

        it("should throw CorruptedEncryptedPrivateKeyError when key cannot be decrypted", async () => {
            vi.mocked(aesModule.aes.decrypt).mockImplementationOnce((data, password, iterations) => {
                if (iterations === 9999) throw new Error("Invalid iterations");
                return "should-not-reach-here";
            });

            const spyDecryptPrivateKey = vi.spyOn(keysService, "decryptPrivateKey").mockImplementationOnce(() => {
                throw new Error("Cannot decrypt");
            });

            await expect(keysService.assertPrivateKeyIsValid("corrupted-key", mockPassword)).rejects.toThrow(
                CorruptedEncryptedPrivateKeyError
            );

            expect(spyDecryptPrivateKey).toHaveBeenCalledWith("corrupted-key", mockPassword);
        });

        it("should throw BadEncodedPrivateKeyError when key has invalid format", async () => {
            vi.mocked(aesModule.aes.decrypt).mockImplementationOnce((data, password, iterations) => {
                if (iterations === 9999) throw new Error("Invalid iterations");
                return "should-not-reach-here";
            });

            const spyDecryptPrivateKey = vi
                .spyOn(keysService, "decryptPrivateKey")
                .mockReturnValueOnce("invalid-format-key");
            const spyIsValidKey = vi.spyOn(keysService, "isValidKey").mockResolvedValueOnce(false);

            await expect(keysService.assertPrivateKeyIsValid("invalid-format-key", mockPassword)).rejects.toThrow(
                BadEncodedPrivateKeyError
            );

            expect(spyDecryptPrivateKey).toHaveBeenCalledWith("invalid-format-key", mockPassword);
            expect(spyIsValidKey).toHaveBeenCalledWith("invalid-format-key");
        });

        it("should not throw any error when key is valid", async () => {
            vi.mocked(aesModule.aes.decrypt).mockImplementationOnce((data, password, iterations) => {
                if (iterations === 9999) throw new Error("Invalid iterations");
                return "should-not-reach-here";
            });

            const spyDecryptPrivateKey = vi
                .spyOn(keysService, "decryptPrivateKey")
                .mockReturnValueOnce("valid-format-key");
            const spyIsValidKey = vi.spyOn(keysService, "isValidKey").mockResolvedValueOnce(true);

            await expect(keysService.assertPrivateKeyIsValid("valid-key", mockPassword)).resolves.not.toThrow();

            expect(spyDecryptPrivateKey).toHaveBeenCalledWith("valid-key", mockPassword);
            expect(spyIsValidKey).toHaveBeenCalledWith("valid-format-key");
        });
    });

    describe("assertValidateKeys", () => {
        it("should not throw error when keys match and can encrypt/decrypt", async () => {
            const mockPrivateKey = "test-private-key";
            const mockPublicKey = "test-public-key";

            await expect(keysService.assertValidateKeys(mockPrivateKey, mockPublicKey)).resolves.not.toThrow();

            const mockOpenpgp = await pgpService.getOpenpgp();

            expect(mockOpenpgp.readKey).toHaveBeenCalledWith({ armoredKey: mockPublicKey });
            expect(mockOpenpgp.readPrivateKey).toHaveBeenCalledWith({ armoredKey: mockPrivateKey });
            expect(mockOpenpgp.createMessage).toHaveBeenCalledWith({ text: "validate-keys" });
            expect(mockOpenpgp.encrypt).toHaveBeenCalled();
            expect(mockOpenpgp.readMessage).toHaveBeenCalled();
            expect(mockOpenpgp.decrypt).toHaveBeenCalled();
        });

        it("should throw KeysDoNotMatchError when decrypted message does not match original", async () => {
            const mockPrivateKey = "invalid-private-key";
            const mockPublicKey = "test-public-key";

            const mockOpenpgp = await pgpService.getOpenpgp();
            vi.mocked(mockOpenpgp.decrypt).mockResolvedValueOnce({
                data: "different-message",
            } as unknown as DecryptMessageResult & { data: WebStream<string> });

            await expect(keysService.assertValidateKeys(mockPrivateKey, mockPublicKey)).rejects.toThrow(
                KeysDoNotMatchError
            );
        });
    });

    describe("isValidKey", () => {
        it("should return true for a valid key", async () => {
            const result = await keysService.isValidKey("valid-key");

            expect(result).toBe(true);
        });

        it("should return false for an invalid key", async () => {
            const result = await keysService.isValidKey("invalid-key");

            expect(result).toBe(false);
        });
    });

    describe("generateNewKeysWithEncrypted", () => {
        it("should generate and encrypt new keys correctly", async () => {
            const mockPrivateKey = "generated-private-key";

            const spyEncryptPrivateKey = vi
                .spyOn(keysService, "encryptPrivateKey")
                .mockReturnValueOnce("encrypted-generated-private-key");

            const result = await keysService.generateNewKeysWithEncrypted(mockPassword);

            expect(spyEncryptPrivateKey).toHaveBeenCalledWith(mockPrivateKey, mockPassword);

            expect(result).toEqual({
                privateKeyArmored: mockPrivateKey,
                privateKeyArmoredEncrypted: "encrypted-generated-private-key",
                publicKeyArmored: Buffer.from("generated-public-key").toString("base64"),
                revocationCertificate: Buffer.from("generated-revocation-cert").toString("base64"),
            });
        });
    });
});

