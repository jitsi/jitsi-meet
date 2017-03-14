/* @flow */

import UIEvents from '../../../../service/UI/UIEvents';

declare var APP: Object;
declare var JitsiMeetJS: Object;
declare var config: Object;

/**
 * Shows SIP number dialog.
 *
 * @returns {void}
 */
function showSipNumberInput() {
    const defaultNumber = config.defaultSipNumber
        ? config.defaultSipNumber
        : '';
    const titleKey = 'dialog.sipMsg';
    const msgString = `
            <input class="input-control"
                   name="sipNumber" type="text"
                   value="${defaultNumber}" autofocus>`;

    APP.UI.messageHandler.openTwoButtonDialog({
        titleKey,
        msgString,
        leftButtonKey: 'dialog.Dial',

        // eslint-disable-next-line max-params
        submitFunction: (e, v, m, f) => {
            if (v && f.sipNumber) {
                APP.UI.emitEvent(UIEvents.SIP_DIAL, f.sipNumber);
            }
        },
        focus: ':input:first'
    });
}

const secondaryToolbarHandlers = {
    'toolbar_button_profile': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.profile.toggled');
        APP.UI.emitEvent(UIEvents.TOGGLE_PROFILE);
    },
    'toolbar_button_chat': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.chat.toggled');
        APP.UI.emitEvent(UIEvents.TOGGLE_CHAT);
    },
    'toolbar_contact_list': () => {
        JitsiMeetJS.analytics.sendEvent(
            'toolbar.contacts.toggled');
        APP.UI.emitEvent(UIEvents.TOGGLE_CONTACT_LIST);
    },
    'toolbar_button_etherpad': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.etherpad.clicked');
        APP.UI.emitEvent(UIEvents.ETHERPAD_CLICKED);
    },
    'toolbar_button_sharedvideo': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.sharedvideo.clicked');
        APP.UI.emitEvent(UIEvents.SHARED_VIDEO_CLICKED);
    },
    'toolbar_button_desktopsharing': () => {
        if (APP.conference.isSharingScreen) {
            JitsiMeetJS.analytics.sendEvent('toolbar.screen.disabled');
        } else {
            JitsiMeetJS.analytics.sendEvent('toolbar.screen.enabled');
        }
        APP.UI.emitEvent(UIEvents.TOGGLE_SCREENSHARING);
    },
    'toolbar_button_sip': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.sip.clicked');
        showSipNumberInput();
    },
    'toolbar_button_dialpad': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.sip.dialpad.clicked');
    },
    'toolbar_button_settings': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.settings.toggled');
        APP.UI.emitEvent(UIEvents.TOGGLE_SETTINGS);
    },
    'toolbar_button_raisehand': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.raiseHand.clicked');
        APP.conference.maybeToggleRaisedHand();
    }
};

export default secondaryToolbarHandlers;
