const { APP_PATH_SIMULATOR, RELEASE_APP_PATH } = require('./constants');

module.exports = {
    iPhone13ProSimulator: {
        'appium:app': APP_PATH_SIMULATOR,
        'appium:appiumVersion': '1.22.3',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': 'iPhone 13 Pro',
        'appium:newCommandTimeout': 240,
        platformName: 'iOS',
        'appium:platformVersion': '15.5',
        'appium:xcodeOrgId': 'AJT772J42H',
        'appium:xcodeSigningId': 'iPhone Developer'
    },

    iPhone13Pro: {
        'appium:app': RELEASE_APP_PATH,
        'appium:appiumVersion': '1.22.3',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': 'iPhone 13 Pro',
        'appium:newCommandTimeout': 240,
        platformName: 'iOS',
        'appium:platformVersion': '15.6',
        'appium:udid': '00008110-001819C63A32801E',
        'appium:xcodeOrgId': 'AJT772J42H',
        'appium:xcodeSigningId': 'iPhone Developer'
    },

    iPhoneXs: {
        'appium:app': RELEASE_APP_PATH,
        'appium:appiumVersion': '1.22.3',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': 'iPhone Xs',
        'appium:newCommandTimeout': 240,
        platformName: 'iOS',
        'appium:platformVersion': '15.1',
        'appium:udid': '00008020-001E59493AE1002E',
        'appium:xcodeOrgId': 'AJT772J42H',
        'appium:xcodeSigningId': 'iPhone Developer'
    },

    ONEPLUSA5000: {
        'appium:appActivity': '.MainActivity',
        'appium:appPackage': 'org.jitsi.meet',
        'appium:appiumVersion': '1.22.3',
        'appium:automationName': 'UiAutomator2',
        'appium:newCommandTimeout': 240,
        platformName: 'Android',
        'appium:platformVersion': '10.0',
        'appium:uid': '2ff2f58d'
    },

    PixelXLEmulator: {
        'appium:appActivity': '.MainActivity',
        'appium:appPackage': 'org.jitsi.meet',
        'appium:appiumVersion': '1.22.3',
        'appium:automationName': 'UiAutomator2',
        'appium:newCommandTimeout': 240,
        platformName: 'Android',
        'appium:platformVersion': '13.0',
        'appium:uid': '867400022047199'
    }
};
