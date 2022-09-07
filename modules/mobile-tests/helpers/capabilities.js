const {
    APP_PATH_SIMULATOR,
    APPIUM_VERSION,
    AUTOMATION_NAME,
    DEVICE_ID,
    DEVICE_NAME,
    ORG_ID,
    PLATFORM_NAME,
    PLATFORM_VERSION,
    RELEASE_APP_PATH
} = require('./constants');

module.exports = {
    iPhone13ProSimulator: {
        'appium:app': APP_PATH_SIMULATOR,
        'appium:appiumVersion': APPIUM_VERSION,
        'appium:automationName': AUTOMATION_NAME || 'XCUITest',
        'appium:deviceName': DEVICE_NAME || 'iPhone 13 Pro',
        'appium:newCommandTimeout': 240,
        platformName: PLATFORM_NAME || 'iOS',
        'appium:platformVersion': '15.5',
        'appium:xcodeOrgId': ORG_ID,
        'appium:xcodeSigningId': 'iPhone Developer'
    },

    iPhoneXs: {
        'appium:app': RELEASE_APP_PATH,
        'appium:appiumVersion': APPIUM_VERSION,
        'appium:automationName': AUTOMATION_NAME || 'XCUITest',
        'appium:deviceName': DEVICE_NAME || 'iPhone Xs',
        'appium:newCommandTimeout': 240,
        platformName: PLATFORM_NAME || 'iOS',
        'appium:platformVersion': PLATFORM_VERSION || '15.1',
        'appium:udid': DEVICE_ID || '00008020-001E59493AE1002E',
        'appium:xcodeOrgId': ORG_ID,
        'appium:xcodeSigningId': 'iPhone Developer'
    },

    ONEPLUSA5000: {
        'appium:appActivity': '.MainActivity',
        'appium:appPackage': 'org.jitsi.meet',
        'appium:appiumVersion': APPIUM_VERSION,
        'appium:automationName': AUTOMATION_NAME || 'UiAutomator2',
        'appium:newCommandTimeout': 240,
        platformName: PLATFORM_NAME || 'Android',
        'appium:platformVersion': PLATFORM_VERSION || '10.0',
        'appium:uid': DEVICE_ID || '2ff2f58d'
    }
};
