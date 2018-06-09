// @flow

import googleElectronClient from './googleElectronClient';
import googleWebClient from './googleWebClient';

declare var JitsiMeetElectron: Object;

export default {
    /**
     * Obtains the Google client for the current platform.
     *
     * @returns {Object|null} The client to use for accessing the Google API or
     * null if the Google API cannot be accessed.
     */
    getClient() {
        if (typeof JitsiMeetElectron === 'object') {
            if (JitsiMeetElectron.googleApi) {
                return googleElectronClient;
            }

            return null;
        }

        return googleWebClient;
    }
};
