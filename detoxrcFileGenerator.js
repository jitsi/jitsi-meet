/* eslint-disable no-undef */

const fs = require('file-system');

const device = {
    android: process.env.android,
    ios: process.env.ios
};

const androidEmulatorArray = [ 'Pixel_3a_API_30_x86' ];
const iOSSimulatorArray = [ 'iPhone 13 Pro' ];

// Returns a random emulator name from the array
const emulatorName = emulatorArray => emulatorArray[Math.floor(Math.random() * emulatorArray.length)];

const getAndroidDevices = () => {
    if (device.android) {
        return {
            'phone': {
                'type': 'android.phone',
                'device': {
                    'avdName': device.android
                }
            }
        };
    }

    return {
        'emulator': {
            'type': 'android.emulator',
            'device': {
                'avdName': emulatorName(androidEmulatorArray)
            }
        }
    };
};

const getAndroidConfiguration = () => {
    if (device.android) {
        return {
            'device': 'phone'
        };
    }

    return {
        'device': 'emulator'
    };
};

const data = {
    'testRunner': 'jest',
    'runnerConfig': 'tests/mobile/config.json',
    'skipLegacyWorkersInjection': true,
    'devices': {
        ...getAndroidDevices(),

        'simulator': {
            'type': 'ios.simulator',
            'device': {
                'type': emulatorName(iOSSimulatorArray)
            }
        }
    },
    'apps': {
        'android.release': {
            'type': 'android.apk',
            'binaryPath': 'android/app/build/outputs/apk/release/app-release.apk',
            'build': 'cd android && ./gradlew assembleRelease assembleAndroidTest && cd ..'
        },

        'ios.release': {
            'type': 'ios.app',
            'binaryPath': 'ios/DerivedData/Build/Products/Release-iphonesimulator/jitsi-meet.app',
            // eslint-disable-next-line max-len
            'build': 'xcodebuild -workspace ios/jitsi-meet.xcworkspace -scheme JitsiMeet -configuration Release -derivedDataPath ios/DerivedData'
        }
    },
    'configurations': {
        'android': {
            ...getAndroidConfiguration(),
            'app': 'android.release'
        },

        'ios': {
            'device': 'simulator',
            'app': 'ios.release'
        }
    }
};

const detoxrc = JSON.stringify(data, null, 2);

fs.writeFile('./.detoxrc.json', detoxrc);
