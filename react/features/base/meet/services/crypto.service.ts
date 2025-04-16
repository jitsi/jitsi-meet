import { CryptoProvider } from '@internxt/sdk';
import { Keys, Password } from '@internxt/sdk/dist/auth';
import crypto from "crypto";
import CryptoJS from "crypto-js";
import { ConfigService } from "./config.service";
import { KeysService } from "./keys.service";

interface PassObjectInterface {
    salt?: string | null;
    password: string;
}

export class CryptoService {
    public static readonly instance: CryptoService = new CryptoService();

    public static readonly cryptoProvider: CryptoProvider = {
        encryptPasswordHash(password: Password, encryptedSalt: string): string {
            const salt = CryptoService.instance.decryptText(encryptedSalt);
            const hashObj = CryptoService.instance.passToHash({ password, salt });
            return CryptoService.instance.encryptText(hashObj.hash);
        },
        async generateKeys(password: Password): Promise<Keys> {
            const { privateKeyArmoredEncrypted, publicKeyArmored, revocationCertificate } =
                await KeysService.instance.generateNewKeysWithEncrypted(password);
            const keys: Keys = {
                privateKeyEncrypted: privateKeyArmoredEncrypted,
                publicKey: publicKeyArmored,
                revocationCertificate: revocationCertificate,
                ecc: {
                    publicKey: publicKeyArmored,
                    privateKeyEncrypted: privateKeyArmoredEncrypted,
                },
                kyber: {
                    publicKey: null,
                    privateKeyEncrypted: null,
                },
            };
            return keys;
        },
    };

    /**
     * Generates the hash for a password, if salt is provided it uses it, in other case it is generated from crypto
     * @param passObject The object containing the password and an optional salt hex encoded
     * @returns The hashed password and the salt
     **/
    public passToHash(passObject: PassObjectInterface): { salt: string; hash: string } {
        const salt = passObject.salt ? CryptoJS.enc.Hex.parse(passObject.salt) : CryptoJS.lib.WordArray.random(128 / 8);
        const hash = CryptoJS.PBKDF2(passObject.password, salt, { keySize: 256 / 32, iterations: 10000 });
        const hashedObjetc = {
            salt: salt.toString(),
            hash: hash.toString(),
        };

        return hashedObjetc;
    }

    /**
     * Encrypts a plain message into an AES encrypted text using APP_CRYPTO_SECRET value from env
     * @param textToEncrypt The plain text to be encrypted
     * @returns The encrypted string in 'hex' encoding
     **/
    public encryptText = (textToEncrypt: string): string => {
        const APP_CRYPTO_SECRET = ConfigService.instance.get("CRYPTO_SECRET");
        return this.encryptTextWithKey(textToEncrypt, APP_CRYPTO_SECRET);
    };

    /**
     * Decrypts an AES encrypted text using APP_CRYPTO_SECRET value from env
     * @param encryptedText The AES encrypted text in 'HEX' encoding
     * @returns The decrypted string in 'utf8' encoding
     **/
    public decryptText = (encryptedText: string): string => {
        const APP_CRYPTO_SECRET = ConfigService.instance.get("CRYPTO_SECRET");
        return this.decryptTextWithKey(encryptedText, APP_CRYPTO_SECRET);
    };

    /**
     * Encrypts a plain message into an AES encrypted text using a secret.
     * [Crypto.JS compatible]:
     * First 8 bytes are reserved for 'Salted__', next 8 bytes are the salt, and the rest is aes content
     * @param textToEncrypt The plain text to be encrypted
     * @param secret The secret used to encrypt
     * @returns The encrypted private string in 'hex' encoding
     **/
    public encryptTextWithKey(textToEncrypt: string, keyToEncrypt: string): string {
        const bytes = CryptoJS.AES.encrypt(textToEncrypt, keyToEncrypt).toString();
        const text64 = CryptoJS.enc.Base64.parse(bytes);

        return text64.toString(CryptoJS.enc.Hex);
    }

    /**
     * Decrypts an AES encrypted text using a secret.
     * [Crypto.JS compatible]:
     * First 8 bytes are reserved for 'Salted__', next 8 bytes are the salt, and the rest is aes content
     * @param encryptedText The AES encrypted text in 'HEX' encoding
     * @param secret The secret used to encrypt
     * @returns The decrypted string in 'utf8' encoding
     **/
    public decryptTextWithKey(encryptedText: string, keyToDecrypt: string): string {
        if (!keyToDecrypt) {
            throw new Error("No key defined. Check .env file");
        }

        const reb = CryptoJS.enc.Hex.parse(encryptedText);
        const bytes = CryptoJS.AES.decrypt(reb.toString(CryptoJS.enc.Base64), keyToDecrypt);

        return bytes.toString(CryptoJS.enc.Utf8);
    }

    /**
     * Generates the key and the iv by transforming a secret and a salt.
     * It will generate the same key and iv if the same secret and salt is used.
     * This function is needed to be Crypto.JS compatible and encrypt/decrypt without errors
     * @param secret The secret used to encrypt
     * @param salt The salt used to encrypt
     * @returns The key and the iv resulted from the secret and the salt combination
     **/
    private getKeyAndIvFrom = (secret: string, salt: Buffer) => {
        const TRANSFORM_ROUNDS = 3;
        const password = Buffer.concat([Buffer.from(secret, "binary"), salt]);
        const md5Hashes: Buffer[] = [];
        let digest = password;

        for (let i = 0; i < TRANSFORM_ROUNDS; i++) {
            md5Hashes[i] = crypto.createHash("md5").update(digest).digest();
            digest = Buffer.concat([md5Hashes[i], password]);
        }

        const key = Buffer.concat([md5Hashes[0], md5Hashes[1]]);
        const iv = md5Hashes[2];
        return { key, iv };
    };
}
