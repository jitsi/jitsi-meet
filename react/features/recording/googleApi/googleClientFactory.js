// @flow

import ElectronGoogleClient from './ElectronGoogleClient';
import WebGoogleClient from './WebGoogleClient';

declare var JitsiMeetElectron: Object;

let client;

export default {
    /**
     * Obtains the Google client for the current platform.
     *
     * @returns {Object|null} The client to use for accessing the Google API or
     * null if the Google API cannot be accessed.
     */
    getClient() {
        if (client) {
            return client;
        }

        if (typeof JitsiMeetElectron === 'object') {
            if (JitsiMeetElectron.googleApi) {
                client = new ElectronGoogleClient();

                return client;
            }

            return null;
        }

        client = new WebGoogleClient();

        return client;
    }
};
