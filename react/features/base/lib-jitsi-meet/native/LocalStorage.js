import { AsyncStorage } from 'react-native';

/**
 * Prefix used to mark keys stored by our app in the global React Native
 * storage.
 */
const JITSI_KEY_PREFIX = '@jitsi/';

/**
 * Web Sorage API compatible object used for polyfilling window.localStorage.
 * The Web Storage API is synchronous, whereas AsyncStorage, the builtin generic
 * storage API in React Native, is asynchronous, so this object is optimistic:
 * it will first store the value locally (in memory) so results can be served
 * synchronously, and then save the value asynchronously.
 *
 * If any of the asynchronous operations produces an error, it's ignored.
 */
export default class LocalStorage {
    /**
     * Loads all keys from React Native's AsyncStorage.
     */
    constructor() {
        AsyncStorage.getAllKeys()
            .then(keys => {
                const jitsiKeys
                    = keys.filter(key => key.startsWith(JITSI_KEY_PREFIX));

                AsyncStorage.multiGet(jitsiKeys)
                    .then(items => {
                        for (const item of items) {
                            const key = item[0].slice(JITSI_KEY_PREFIX.length);
                            const value = item[1];

                            this[key] = value;
                        }
                    });
            });
    }

    /**
     * Gets the number of items stored.
     *
     * @returns {number}
     */
    get length() {
        return Object.keys(this).length;
    }

    /**
     * Removes all keys from the storage.
     *
     * @returns {void}
     */
    clear() {
        const keys = Object.keys(this);

        for (const key of keys) {
            delete this[key];
            AsyncStorage.removeItem(`${JITSI_KEY_PREFIX}${key}`);
        }
    }

    /**
     * Gets the element that was stored for the given `key`.
     *
     * @param {string} key - The requested `key`.
     * @returns {string|null}
     */
    getItem(key) {
        if (this.hasOwnProperty(key)) {
            return this[key];
        }

        return null;
    }

    /**
     * Gets the nth element in the storage.
     *
     * @param {number} n - The element number that is requested.
     * @returns {string}
     */
    key(n) {
        return Object.keys(this)[n || 0];
    }

    /**
     * Removes the given `key` from the storage.
     *
     * @param {string} key - The `key` which will be removed.
     * @returns {void}
     */
    removeItem(key) {
        delete this[key];
        AsyncStorage.removeItem(`${JITSI_KEY_PREFIX}${key}`);
    }

    /**
     * Stores the given `value` for the given `key`. If a value or ready exists
     * for that key, it's updated.
     *
     * @param {string} key - The key for the value which will be stored.
     * @param {string} value - The value which will be stored.
     * @returns {void}
     */
    setItem(key, value) {
        // eslint-disable-next-line no-param-reassign
        value = String(value);
        this[key] = value;
        AsyncStorage.setItem(`${JITSI_KEY_PREFIX}${key}`, value);
    }
}
