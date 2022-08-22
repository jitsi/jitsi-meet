const { APP_PATH } = require('./constants');

module.exports = {
    iPhone13ProSimulator: {
        'appium:app': APP_PATH,
        'appium:appiumVersion': '1.22.3',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': 'iPhone 13 Pro',
        'appium:newCommandTimeout': 240,
        platformName: 'iOS',
        'appium:platformVersion': '15.5',
        'appium:uid': '80EE304B-5146-4130-B4DD-CBB4341B97BF'
    },

    iPhone13Pro: {
        'appium:app': APP_PATH,
        'appium:appiumVersion': '1.22.3',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': 'iPhone 13 Pro',
        'appium:newCommandTimeout': 240,
        platformName: 'iOS',
        'appium:udid': '00008110-001819C63A32801E'
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
    }
};
