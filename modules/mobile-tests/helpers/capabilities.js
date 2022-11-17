/* eslint-disable no-undef */
const path = require('path');
const appiumVersion = '1.22.3';

module.exports = {

    IOS: {
        app: path.join(process.cwd(), 'JitsiMeet.xcarchive/Products/Applications/jitsi-meet.app'),
        appiumVersion,
        automationName: 'XCUITest',
        bundleId: 'org.jitsi.meet',

        //deviceName is mandatory
        deviceName: process.env.DEVICE_NAME || 'Calin',
        newCommandTimeout: 240,
        platformName: 'iOS',
        platformVersion: process.env.PLATFORM_VERSION || '15.6',
        udid: '00008110-001819C63A32801E',
        xcodeOrgId: 'AJT772J42H',
        xcodeSigningId: 'iPhone Developer'
    },

    ANDROID: {
        appActivity: '.MainActivity',
        appPackage: 'org.jitsi.meet',
        appiumVersion,
        automationName: 'UiAutomator2',
        newCommandTimeout: 240,
        platformName: 'Android',
        platformVersion: process.env.PLATFORM_VERSION || 10,
        uid: process.env.DEVICE_ID
    }
};
