import amplitude from 'amplitude-js';

export default {
    getInstance(options = {}) {
        return amplitude.getInstance(options.instanceName);
    }
};
