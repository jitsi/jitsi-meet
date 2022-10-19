const IOS = {
    // eslint-disable-next-line max-len
    'appium:app': 'Users/cchitu/Library/Developer/Xcode/DerivedData/jitsi-meet-gpsplsfarleyxebhmcufemivqqbl/Build/Products/Debug-iphonesimulator/jitsi-meet.app',
    'appium:appiumVersion': '1.22.3',
    'appium:automationName': 'XCUITest',
    'appium:newCommandTimeout': 240,
    platformName: 'iOS',
    'appium:platformVersion': process.env.PLATFORM_VERSION,
    'appium:udid': process.env.DEVICE_ID,
    'appium:xcodeOrgId': 'AJT772J42H',
    'appium:xcodeSigningId': 'iPhone Developer'
};

const DEVICE_IOS = {
    ...IOS,
    // eslint-disable-next-line max-len
    'appium:app': '/Users/cchitu/Library/Developer/Xcode/Archives/2022-09-01/JitsiMeet.xcarchive/Products/Applications/jitsi-meet.app'
}

const DEVICE_ANDROID = {
    'appium:appActivity': '.MainActivity',
    'appium:appPackage': 'org.jitsi.meet',
    'appium:appiumVersion': '1.22.3',
    'appium:automationName': 'UiAutomator2',
    'appium:newCommandTimeout': 240,
    platformName: 'Android',
    'appium:platformVersion': process.env.PLATFORM_VERSION,
    'appium:uid': process.env.DEVICE_ID
}

module.exports = {
    IOS: {
        ...IOS
    },

    DEVICE_IOS: {
        ...DEVICE_IOS
    },

    iPhone13ProSimulator: {
        ...IOS
    },

    iPhoneXs: {
        ...DEVICE_IOS,
        'appium:platformVersion': '15.1',
        'appium:udid': '00008020-001E59493AE1002E'
    },

    ONEPLUSA5000: {
        ...DEVICE_ANDROID,
        'appium:platformVersion': '10.0',
        'appium:uid': '2ff2f58d'
    }
};
