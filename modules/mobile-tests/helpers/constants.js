/* eslint-disable no-undef */

module.exports = {
    APPIUM_VERSION: process.env.APPIUM_VERSION || '1.22.3',
    // eslint-disable-next-line max-len
    APP_PATH_SIMULATOR: 'Users/cchitu/Library/Developer/Xcode/DerivedData/jitsi-meet-gpsplsfarleyxebhmcufemivqqbl/Build/Products/Debug-iphonesimulator/jitsi-meet.app',
    AUTOMATION_NAME: process.env.AUTOMATION_NAME,

    ANDROID_DEVICE: driver.isAndroid,
    DEVICE_ID: process.env.DEVICE_ID,
    DEVICE_NAME: process.env.DEVICE_NAME,

    IOS_DEVICE: driver.isIOS,
    MAX_INSTANCES: process.env.MAX_INSTANCES || 1,
    ORG_ID: process.env.ORG_ID || 'AJT772J42H',
    PLATFORM_NAME: process.env.PLATFORM_NAME,
    PLATFORM_VERSION: process.env.PLATFORM_VERSION,
    // eslint-disable-next-line max-len
    RELEASE_APP_PATH: '/Users/cchitu/Library/Developer/Xcode/Archives/2022-09-01/JitsiMeet.xcarchive/Products/Applications/jitsi-meet.app'
};
