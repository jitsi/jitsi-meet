import EventEmitter from 'events';

import { ONLINE_STATE_CHANGED_EVENT } from './events';

/**
 * The network info service implementation for web (Chrome, Firefox and Safari).
 */
export default class NetworkInfoService extends EventEmitter {
    _onlineStateListener: any;
    _offlineStateListener: any;

    /**
     * Creates new instance...
     */
    constructor() {
        super();
        this._onlineStateListener = this._handleOnlineStatusChange.bind(this, /* online */ true);
        this._offlineStateListener = this._handleOnlineStatusChange.bind(this, /* offline */ false);
    }

    /**
     * Callback function to track the online state.
     *
     * @param {boolean} isOnline - Is the browser online or not.
     * @private
     * @returns {void}
     */
    _handleOnlineStatusChange(isOnline: boolean) {
        this.emit(ONLINE_STATE_CHANGED_EVENT, { isOnline });
    }

    /**
     * Checks for support.
     *
     * @returns {boolean}
     */
    static isSupported() {
        return Boolean(window.addEventListener) && typeof navigator.onLine !== 'undefined';
    }

    /**
     * Starts the service.
     *
     * @returns {void}
     */
    start() {
        window.addEventListener('online', this._onlineStateListener);
        window.addEventListener('offline', this._offlineStateListener);
    }

    /**
     * Stops the service.
     *
     * @returns {void}
     */
    stop() {
        window.removeEventListener('online', this._onlineStateListener);
        window.removeEventListener('offline', this._offlineStateListener);
    }
}
