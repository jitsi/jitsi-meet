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
    }
};
