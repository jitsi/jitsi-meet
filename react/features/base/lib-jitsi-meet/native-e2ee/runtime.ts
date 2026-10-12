type IntegerArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array;

export interface INativeEntropy {
    getRandomBase64: (length: number) => string;
}

export interface INativeCrypto {
    jitsiE2EERatchet: (bytes: number[]) => Promise<number[]>;
}

export interface IEntropyRuntime {
    crypto?: {
        getRandomValues?: <T extends IntegerArray>(array: T) => T;
    };
}

/**
 * Installs the native CSPRNG directly, without the package's remote-debug fallback.
 * The restoration function is used if registration fails before the provider is installed.
 *
 * @param {Object} runtime - The native global object.
 * @param {Object} nativeEntropy - The RNGetRandomValues native module.
 * @param {Function} decodeBase64 - A base64 decoder.
 * @returns {Function} Restores the previous entropy implementation.
 */
export function installSecureEntropy(
        runtime: IEntropyRuntime, nativeEntropy: INativeEntropy, decodeBase64: (value: string) => string | null) {
    if (typeof nativeEntropy?.getRandomBase64 !== 'function') {
        throw new Error('Native entropy is unavailable');
    }
    const previousCrypto = runtime.crypto;
    const previous = previousCrypto?.getRandomValues;

    runtime.crypto ||= {};
    runtime.crypto.getRandomValues = <T extends IntegerArray>(array: T): T => {
        if (!(array instanceof Int8Array || array instanceof Uint8Array
                || array instanceof Uint8ClampedArray || array instanceof Int16Array
                || array instanceof Uint16Array || array instanceof Int32Array
                || array instanceof Uint32Array) || array.byteLength > 65536) {
            throw new Error('Invalid native entropy request');
        }
        if (array.byteLength === 0) {
            return array;
        }
        let bytes: Uint8Array | undefined;

        try {
            const encoded = nativeEntropy.getRandomBase64(array.byteLength);

            if (typeof encoded !== 'string'
                    || encoded.length !== 4 * Math.ceil(array.byteLength / 3)
                    || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
                throw new Error('Invalid native entropy response');
            }
            const decoded = decodeBase64(encoded);

            if (typeof decoded !== 'string' || decoded.length !== array.byteLength) {
                throw new Error('Invalid native entropy response');
            }
            bytes = new Uint8Array(array.byteLength);
            for (let i = 0; i < bytes.length; i++) {
                const byte = decoded.charCodeAt(i);

                if (byte > 255) {
                    throw new Error('Invalid native entropy response');
                }
                bytes[i] = byte;
            }
            new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(bytes);

            return array;
        } finally {
            bytes?.fill(0);
        }
    };

    return () => {
        if (previousCrypto) {
            if (previous) {
                previousCrypto.getRandomValues = previous;
            } else {
                delete previousCrypto.getRandomValues;
            }
            runtime.crypto = previousCrypto;
        } else {
            delete runtime.crypto;
        }
    };
}

/**
 * Adapts managed key imports and HKDF ratchets to the native bridge.
 * Tokens are opaque, single-use handles; mutable temporary material is erased.
 *
 * @param {Object} nativeModule - The WebRTC native module.
 * @returns {Object} Native key import and ratchet operations.
 */
export function createNativeCrypto(nativeModule: INativeCrypto) {
    const materialForToken = new WeakMap<object, Uint8Array>();

    return Object.freeze({
        importKey(bytes: ArrayBuffer | Uint8Array): Promise<object> {
            const material = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;

            if (!(material instanceof Uint8Array) || material.length !== 32) {
                return Promise.reject(new Error('Expected 32-byte managed key'));
            }
            const token = Object.freeze({});

            materialForToken.set(token, material.slice());

            return Promise.resolve(token);
        },
        async ratchet(token: object): Promise<ArrayBuffer> {
            const material = materialForToken.get(token);

            if (!material) {
                throw new Error('Unknown or consumed native key token');
            }
            materialForToken.delete(token);
            const bridgeBytes = Array.from(material);
            let bytes: number[] | undefined;

            try {
                bytes = await nativeModule.jitsiE2EERatchet(bridgeBytes);
                if (!Array.isArray(bytes) || bytes.length !== 32
                        || bytes.some(byte => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
                    throw new Error('Invalid native ratchet result');
                }

                return new Uint8Array(bytes).buffer;
            } finally {
                material.fill(0);
                bridgeBytes.fill(0);
                if (Array.isArray(bytes)) {
                    bytes.fill(0);
                }
            }
        }
    });
}
