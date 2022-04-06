const { ANDROID_DEVICE, ANDROID_SIMULATOR } = require('./constants');

module.exports = {
    getAndroidDevices: () => {
        if (ANDROID_DEVICE) {
            return {
                'phone': {
                    'type': 'android.attached',
                    'device': {
                        'adbName': ANDROID_DEVICE
                    }
                }
            };
        }

        return {
            'emulator': {
                'type': 'android.emulator',
                'device': {
                    'avdName': ANDROID_SIMULATOR
                }
            }
        };
    },

    getAndroidConfiguration: () => {
        if (ANDROID_DEVICE) {
            return {
                'device': 'phone'
            };
        }

        return {
            'device': 'emulator'
        };
    }
};
