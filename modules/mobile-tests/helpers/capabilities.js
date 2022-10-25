/* eslint-disable no-undef */

const appiumVersion = '1.22.3';

module.exports = {
    IOS: {
        // eslint-disable-next-line max-len
        'appium:app': '~/Library/Developer/Xcode/Archives/2022-09-01/JitsiMeet.xcarchive/Products/Applications/jitsi-meet.app',
        'appium:appiumVersion': appiumVersion,
        'appium:automationName': 'XCUITest',
        'appium:newCommandTimeout': 240,
        platformName: 'iOS',
        'appium:platformVersion': process.env.PLATFORM_VERSION || 12,
        'appium:udid': process.env.DEVICE_ID,
        'appium:xcodeOrgId': process.env.ORG_ID,
        'appium:xcodeSigningId': 'iPhone Developer'
    },

    ANDROID: {
        'appium:appActivity': '.MainActivity',
        'appium:appPackage': 'org.jitsi.meet',
        'appium:appiumVersion': appiumVersion,
        'appium:automationName': 'UiAutomator2',
        'appium:newCommandTimeout': 240,
        platformName: 'Android',
        'appium:platformVersion': process.env.PLATFORM_VERSION || 10,
        'appium:uid': process.env.DEVICE_ID
    }
};
