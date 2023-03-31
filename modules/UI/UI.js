/* global APP, config */


const UI = {};

import Logger from '@jitsi/logger';
import EventEmitter from 'events';

import { isMobileBrowser } from '../../react/features/base/environment/utils';
import { setColorAlpha } from '../../react/features/base/util/helpers';
import { setDocumentUrl } from '../../react/features/etherpad/actions';
import { setFilmstripVisible } from '../../react/features/filmstrip/actions.any';
import {
    joinLeaveNotificationsDisabled,
    setNotificationsEnabled,
    showNotification
} from '../../react/features/notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../react/features/notifications/constants';
import {
    dockToolbox,
    setToolboxEnabled,
    showToolbox
} from '../../react/features/toolbox/actions.web';
import UIEvents from '../../service/UI/UIEvents';

import EtherpadManager from './etherpad/Etherpad';
import messageHandler from './util/MessageHandler';
import UIUtil from './util/UIUtil';
import VideoLayout from './videolayout/VideoLayout';

const logger = Logger.getLogger(__filename);

UI.messageHandler = messageHandler;

const eventEmitter = new EventEmitter();

UI.eventEmitter = eventEmitter;

let etherpadManager;

const UIListeners = new Map([
    [
        UIEvents.ETHERPAD_CLICKED,
        () => etherpadManager && etherpadManager.toggleEtherpad()
    ], [
        UIEvents.TOGGLE_FILMSTRIP,
        () => UI.toggleFilmstrip()
    ]
]);

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
 * Notify user that server has shut down.
 */
UI.notifyGracefulShutdown = function() {
    messageHandler.showError({
        descriptionKey: 'dialog.gracefulShutdown',
        titleKey: 'dialog.serviceUnavailable'
    });
};

/**
 * Notify user that reservation error happened.
 */
UI.notifyReservationError = function(code, msg) {
    messageHandler.showError({
        descriptionArguments: {
            code,
            msg
        },
        descriptionKey: 'dialog.reservationErrorMsg',
        titleKey: 'dialog.reservationError'
    });
};

/**
 * Initialize conference UI.
 */
UI.initConference = function() {
    UI.showToolbar();
};

/**
 * Starts the UI module and initializes all related components.
 *
 * @returns {boolean} true if the UI is ready and the conference should be
 * established, false - otherwise (for example in the case of welcome page)
 */
UI.start = function() {
    VideoLayout.initLargeVideo();

    // Do not animate the video area on UI start (second argument passed into
    // resizeVideoArea) because the animation is not visible anyway. Plus with
    // the current dom layout, the quality label is part of the video layout and
    // will be seen animating in.
    VideoLayout.resizeVideoArea();

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
 * Setup some UI event listeners.
 */
UI.registerListeners
    = () => UIListeners.forEach((value, key) => UI.addListener(key, value));

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
    if (etherpadManager || !config.etherpad_base || !name) {
        return;
    }
    logger.log('Etherpad is enabled');

    etherpadManager = new EtherpadManager(eventEmitter);

    const url = new URL(name, config.etherpad_base);

    APP.store.dispatch(setDocumentUrl(url.toString()));

    if (config.openSharedDocumentOnJoin) {
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
 * Toggles filmstrip.
 */
UI.toggleFilmstrip = function() {
    const { visible } = APP.store.getState()['features/filmstrip'];

    APP.store.dispatch(setFilmstripVisible(!visible));
};

/**
 * Sets muted audio state for participant
 */
UI.setAudioMuted = function(id) {
    // FIXME: Maybe this can be removed!
    if (APP.conference.isLocalId(id)) {
        APP.conference.updateAudioIconEnabled();
    }
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

/**
 * Adds a listener that would be notified on the given type of event.
 *
 * @param type the type of the event we're listening for
 * @param listener a function that would be called when notified
 */
UI.addListener = function(type, listener) {
    eventEmitter.on(type, listener);
};

/**
 * Removes the all listeners for all events.
 *
 * @returns {void}
 */
UI.removeAllListeners = function() {
    eventEmitter.removeAllListeners();
};

/**
 * Emits the event of given type by specifying the parameters in options.
 *
 * @param type the type of the event we're emitting
 * @param options the parameters for the event
 */
UI.emitEvent = (type, ...options) => eventEmitter.emit(type, ...options);

// Used by torture.
UI.showToolbar = timeout => APP.store.dispatch(showToolbox(timeout));

// Used by torture.
UI.dockToolbar = dock => APP.store.dispatch(dockToolbox(dock));

/**
 * Notify user that connection failed.
 * @param {string} stropheErrorMsg raw Strophe error message
 */
UI.notifyConnectionFailed = function(stropheErrorMsg) {
    let descriptionKey;
    let descriptionArguments;

    if (stropheErrorMsg) {
        descriptionKey = 'dialog.connectErrorWithMsg';
        descriptionArguments = { msg: stropheErrorMsg };
    } else {
        descriptionKey = 'dialog.connectError';
    }

    messageHandler.showError({
        descriptionArguments,
        descriptionKey,
        titleKey: 'connection.CONNFAIL'
    });
};


/**
 * Notify user that maximum users limit has been reached.
 */
UI.notifyMaxUsersLimitReached = function() {
    messageHandler.showError({
        hideErrorSupportLink: true,
        descriptionKey: 'dialog.maxUsersLimitReached',
        titleKey: 'dialog.maxUsersLimitReachedTitle'
    });
};

UI.handleLastNEndpoints = function(leavingIds, enteringIds) {
    VideoLayout.onLastNEndpointsChanged(leavingIds, enteringIds);
};

/**
 * Update audio level visualization for specified user.
 * @param {string} id user id
 * @param {number} lvl audio level
 */
UI.setAudioLevel = (id, lvl) => VideoLayout.setAudioLevel(id, lvl);

UI.notifyTokenAuthFailed = function() {
    messageHandler.showError({
        descriptionKey: 'dialog.tokenAuthFailed',
        titleKey: 'dialog.tokenAuthFailedTitle'
    });
};

/**
 * Update list of available physical devices.
 */
UI.onAvailableDevicesChanged = function() {
    APP.conference.updateAudioIconEnabled();
    APP.conference.updateVideoIconEnabled();
};

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
