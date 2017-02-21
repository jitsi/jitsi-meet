/* @flow */

import UIEvents from '../../../../service/UI/UIEvents';

declare var APP: Object;
declare var JitsiMeetJS: Object;

const secondaryToolbarHandlers = {
    'toolbar_button_profile': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.profile.toggled');
        emitter.emit(UIEvents.TOGGLE_PROFILE);
    },
    'toolbar_button_chat': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.chat.toggled');
        emitter.emit(UIEvents.TOGGLE_CHAT);
    },
    'toolbar_contact_list': () => {
        JitsiMeetJS.analytics.sendEvent(
            'toolbar.contacts.toggled');
        emitter.emit(UIEvents.TOGGLE_CONTACT_LIST);
    },
    'toolbar_button_etherpad': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.etherpad.clicked');
        emitter.emit(UIEvents.ETHERPAD_CLICKED);
    },
    'toolbar_button_sharedvideo': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.sharedvideo.clicked');
        emitter.emit(UIEvents.SHARED_VIDEO_CLICKED);
    },
    'toolbar_button_desktopsharing': () => {
        if (APP.conference.isSharingScreen) {
            JitsiMeetJS.analytics.sendEvent('toolbar.screen.disabled');
        } else {
            JitsiMeetJS.analytics.sendEvent('toolbar.screen.enabled');
        }
        emitter.emit(UIEvents.TOGGLE_SCREENSHARING);
    },
    'toolbar_button_sip': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.sip.clicked');
        showSipNumberInput();
    },
    'toolbar_button_dialpad': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.sip.dialpad.clicked');
        dialpadButtonClicked();
    },
    'toolbar_button_settings': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.settings.toggled');
        emitter.emit(UIEvents.TOGGLE_SETTINGS);
    },
    'toolbar_button_raisehand': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.raiseHand.clicked');
        APP.conference.maybeToggleRaisedHand();
    }
};

export default secondaryToolbarHandlers;
