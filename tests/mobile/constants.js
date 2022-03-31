const { v4 } = require('uuid');

module.exports =  {
    ANDROID_SIMULATOR: process.env.ANDROID_SIMULATOR || 'Pixel_3a_XL_API_31',
    ANDROID_DEVICE: process.env.ANDROID_DEVICE || 'Pixel_3a_XL_API_31',
    IOS_SIMULATOR: process.env.IOS_SIMULATOR || 'iPhone 13 Pro',
    DISPLAY_NAME: 'John Doe',
    RANDOM_ROOM_NAME: v4(),
    DISPLAY_NAME_INPUT_ID: 'display-name-input',
    WELCOME_PAGE_ID: 'welcome-screen',
    ROOM_NAME_INPUT_ID: 'room-name-input',
    JOIN_ROOM_BUTTON_ID: 'join-room-button',
    DRAWER_MENU_BUTTON_ID: 'drawer-menu-button',
    DRAWER_NAVIGATOR_ID: 'drawer-navigator',
    HEADER_BACK_NAV_BUTTON_ID: 'header-back-nav-button',
    MICROPHONE_BUTTON_ID: 'microphone-button',
    CAMERA_BUTTON_ID: 'camera-button'
}

