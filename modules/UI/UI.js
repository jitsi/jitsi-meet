/* global APP, config */


const UI = {};

import Logger from '@jitsi/logger';

import {
    conferenceWillInit
} from '../../react/features/base/conference/actions';
import { isMobileBrowser } from '../../react/features/base/environment/utils';
import { setColorAlpha } from '../../react/features/base/util/helpers';
import { sanitizeUrl } from '../../react/features/base/util/uri';
import { setDocumentUrl } from '../../react/features/etherpad/actions';
import {
    setNotificationsEnabled,
    showNotification
} from '../../react/features/notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../react/features/notifications/constants';
import { joinLeaveNotificationsDisabled } from '../../react/features/notifications/functions';
import {
    dockToolbox,
    setToolboxEnabled,
    showToolbox
} from '../../react/features/toolbox/actions.web';

import EtherpadManager from './etherpad/Etherpad';
import UIUtil from './util/UIUtil';
import VideoLayout from './videolayout/VideoLayout';

const logger = Logger.getLogger(__filename);

let etherpadManager;

/**
 * Indicates if we're currently in full screen mode.
 *
 * @return {boolean} {true} to indicate that we're currently in full screen
 * mode, {false} otherwise
 */
UI.isFullScreen = function() {
    return UIUtil.isFullScreen();
};

/**
 * Initialize conference UI.
 */
UI.initConference = function() {
    UI.showToolbar();
};

/**
 * Starts the UI module and initializes all related components.
 */
UI.start = function() {
    APP.store.dispatch(conferenceWillInit());

    if (isMobileBrowser()) {
        document.body.classList.add('mobile-browser');
    } else {
        document.body.classList.add('desktop-browser');
    }

    if (config.backgroundAlpha !== undefined) {
        const backgroundColor = getComputedStyle(document.body).getPropertyValue('background-color');
        const alphaColor = setColorAlpha(backgroundColor, config.backgroundAlpha);

        document.body.style.backgroundColor = alphaColor;
    }

    if (config.iAmRecorder) {
        // in case of iAmSipGateway keep local video visible
        if (!config.iAmSipGateway) {
            APP.store.dispatch(setNotificationsEnabled(false));
        }

        APP.store.dispatch(setToolboxEnabled(false));
    }
};

/**
 * Handles etherpad click.
 */
UI.onEtherpadClicked = function() {
    etherpadManager && etherpadManager.toggleEtherpad();
};

/**
 *
 */
function onResize() {
    VideoLayout.onResize();
}

/**
 * Setup some DOM event listeners.
 */
UI.bindEvents = () => {
    // Resize and reposition videos in full screen mode.
    document.addEventListener('webkitfullscreenchange', onResize);
    document.addEventListener('mozfullscreenchange', onResize);
    document.addEventListener('fullscreenchange', onResize);

    window.addEventListener('resize', onResize);
};

/**
 * Unbind some DOM event listeners.
 */
UI.unbindEvents = () => {
    document.removeEventListener('webkitfullscreenchange', onResize);
    document.removeEventListener('mozfullscreenchange', onResize);
    document.removeEventListener('fullscreenchange', onResize);

    window.removeEventListener('resize', onResize);
};

/**
 * Setup and show Etherpad.
 * @param {string} name etherpad id
 */
UI.initEtherpad = name => {
    const { getState, dispatch } = APP.store;
    const configState = getState()['features/base/config'];
    const etherpadBaseUrl = sanitizeUrl(configState.etherpad_base);

    if (etherpadManager || !etherpadBaseUrl || !name) {
        return;
    }
    logger.log('Etherpad is enabled');

    etherpadManager = new EtherpadManager();

    const url = new URL(name, etherpadBaseUrl);

    dispatch(setDocumentUrl(url.toString()));

    if (configState.openSharedDocumentOnJoin) {
        etherpadManager.toggleEtherpad();
    }
};

/**
 * Returns the shared document manager object.
 * @return {EtherpadManager} the shared document manager object
 */
UI.getSharedDocumentManager = () => etherpadManager;

/**
 * Show user on UI.
 * @param {JitsiParticipant} user
 */
UI.addUser = function(user) {
    const status = user.getStatus();

    if (status) {
        // FIXME: move updateUserStatus in participantPresenceChanged action
        UI.updateUserStatus(user, status);
    }
};

/**
 * Updates the user status.
 *
 * @param {JitsiParticipant} user - The user which status we need to update.
 * @param {string} status - The new status.
 */
UI.updateUserStatus = (user, status) => {
    const reduxState = APP.store.getState() || {};
    const { calleeInfoVisible } = reduxState['features/invite'] || {};

    // We hide status updates when join/leave notifications are disabled,
    // as jigasi is the component with statuses and they are seen as join/leave notifications.
    if (!status || calleeInfoVisible || joinLeaveNotificationsDisabled()) {
        return;
    }

    const displayName = user.getDisplayName();

    APP.store.dispatch(showNotification({
        titleKey: `${displayName} connected`,
        descriptionKey: 'dialOut.statusMessage'
    }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
};

/**
 * Sets muted video state for participant
 */
UI.setVideoMuted = function(id) {
    VideoLayout._updateLargeVideoIfDisplayed(id, true);

    if (APP.conference.isLocalId(id)) {
        APP.conference.updateVideoIconEnabled();
    }
};

UI.updateLargeVideo = (id, forceUpdate) => VideoLayout.updateLargeVideo(id, forceUpdate);

// Used by torture.
UI.showToolbar = timeout => APP.store.dispatch(showToolbox(timeout));

// Used by torture.
UI.dockToolbar = dock => APP.store.dispatch(dockToolbox(dock));

UI.handleLastNEndpoints = function(leavingIds, enteringIds) {
    VideoLayout.onLastNEndpointsChanged(leavingIds, enteringIds);
};

/**
 * Update audio level visualization for specified user.
 * @param {string} id user id
 * @param {number} lvl audio level
 */
UI.setAudioLevel = (id, lvl) => VideoLayout.setAudioLevel(id, lvl);

/**
 * Returns the id of the current video shown on large.
 * Currently used by tests (torture).
 */
UI.getLargeVideoID = function() {
    return VideoLayout.getLargeVideoID();
};

/**
 * Returns the current video shown on large.
 * Currently used by tests (torture).
 */
UI.getLargeVideo = function() {
    return VideoLayout.getLargeVideo();
};

// TODO: Export every function separately. For now there is no point of doing
// this because we are importing everything.
export default UI;
