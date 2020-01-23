import amplitude from 'amplitude-js';

export default {
    /**
     * Returns the AmplitudeClient instance.
     *
     * @param {Object} options - Optional parameters.
     * @property {string} options.instanceName - The name of the AmplitudeClient instance.
     * @returns {AmplitudeClient}
     */
    getInstance(options = {}) {
        return amplitude.getInstance(options.instanceName);
    },

    /**
     * Sets the device id to the value of __AMDID cookie or sets the __AMDID cookie value to the current device id in
     * case the __AMDID cookie is not set.
     *
     * @param {*} options - Optional parameters.
     * @property {string} options.instanceName - The name of the AmplitudeClient instance.
     * @property {string} options.host - The host from the original URL.
     * @returns {void}
     */
    fixDeviceID(options) {
        const deviceId = document.cookie.replace(/(?:(?:^|.*;\s*)__AMDID\s*=\s*([^;]*).*$)|^.*$/, '$1');
        const instance = this.getInstance(options);

        if (deviceId === '') {
            const { host = '' } = options;

            document.cookie
                = `__AMDID=${instance.options.deviceId};max-age=630720000${
                    host === '' ? '' : `;domain=.${host}`}`; // max-age=10 years
        } else {
            instance.setDeviceId(deviceId);
        }
    }
};
