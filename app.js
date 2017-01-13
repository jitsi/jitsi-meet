/* global $, config, getRoomName, loggingConfig, JitsiMeetJS */
/* application specific logic */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import "babel-polyfill";
import "jquery";
import "jquery-contextmenu";
import "jquery-ui";
import "strophe";
import "strophe-disco";
import "jQuery-Impromptu";
import "autosize";

import 'aui';
import 'aui-experimental';
import 'aui-css';
import 'aui-experimental-css';

window.toastr = require("toastr");

const Logger = require("jitsi-meet-logger");
const LogCollector = Logger.LogCollector;
import JitsiMeetLogStorage from "./modules/util/JitsiMeetLogStorage";

import URLProcessor from "./modules/config/URLProcessor";
import {
    generateRoomWithoutSeparator
} from './react/features/base/util/roomnameGenerator';

import UI from "./modules/UI/UI";
import settings from "./modules/settings/Settings";
import conference from './conference';
import ConferenceUrl from './modules/URL/ConferenceUrl';
import API from './modules/API/API';

import UIEvents from './service/UI/UIEvents';
import getTokenData from "./modules/tokendata/TokenData";
import translation from "./modules/translation/translation";

const ConferenceEvents = JitsiMeetJS.events.conference;

/**
 * Tries to push history state with the following parameters:
 * 'VideoChat', `Room: ${roomName}`, URL. If fail, prints the error and returns
 * it.
 */
function pushHistoryState(roomName, URL) {
    try {
        window.history.pushState(
            'VideoChat', `Room: ${roomName}`, URL
        );
    } catch (e) {
        logger.warn("Push history state failed with parameters:",
            'VideoChat', `Room: ${roomName}`, URL, e);
        return e;
    }
    return null;
}

/**
 * Replaces current history state(replaces the URL displayed by the browser).
 * @param {string} newUrl the URL string which is to be displayed by the browser
 * to the user.
 */
function replaceHistoryState (newUrl) {
    if (window.history
        && typeof window.history.replaceState === 'function') {
        window.history.replaceState({}, document.title, newUrl);
    }
}

/**
 * Builds and returns the room name.
 */
function buildRoomName () {
    let roomName = getRoomName();

    if(!roomName) {
        let word = generateRoomWithoutSeparator();
        roomName = word.toLowerCase();
        let historyURL = window.location.href + word;
        //Trying to push state with current URL + roomName
        pushHistoryState(word, historyURL);
    }

    return roomName;
}

/**
 * Adjusts the logging levels.
 * @private
 */
function configureLoggingLevels () {
    // NOTE The library Logger is separated from the app loggers, so the levels
    // have to be set in two places

    // Set default logging level
    const defaultLogLevel
        = loggingConfig.defaultLogLevel || JitsiMeetJS.logLevels.TRACE;
    Logger.setLogLevel(defaultLogLevel);
    JitsiMeetJS.setLogLevel(defaultLogLevel);

    // NOTE console was used on purpose here to go around the logging
    // and always print the default logging level to the console
    console.info("Default logging level set to: " + defaultLogLevel);

    // Set log level for each logger
    if (loggingConfig) {
        Object.keys(loggingConfig).forEach(function(loggerName) {
            if ('defaultLogLevel' !== loggerName) {
                const level = loggingConfig[loggerName];
                Logger.setLogLevelById(level, loggerName);
                JitsiMeetJS.setLogLevelById(level, loggerName);
            }
        });
    }
}

const APP = {
    // Used by do_external_connect.js if we receive the attach data after
    // connect was already executed. status property can be "initialized",
    // "ready" or "connecting". We are interested in "ready" status only which
    // means that connect was executed but we have to wait for the attach data.
    // In status "ready" handler property will be set to a function that will
    // finish the connect process when the attach data or error is received.
    connect: {
        status: "initialized",
        handler: null
    },
    // Used for automated performance tests
    connectionTimes: {
        "index.loaded": window.indexLoadedTime
    },
    UI,
    settings,
    conference,
    translation,
    /**
     * The log collector which captures JS console logs for this app.
     * @type {LogCollector}
     */
    logCollector: null,
    /**
     * Indicates if the log collector has been started (it will not be started
     * if the welcome page is displayed).
     */
    logCollectorStarted : false,
    /**
     * After the APP has been initialized provides utility methods for dealing
     * with the conference room URL(address).
     * @type ConferenceUrl
     */
    ConferenceUrl : null,
    connection: null,
    API,
    init () {
        this.initLogging();
        this.keyboardshortcut =
            require("./modules/keyboardshortcut/keyboardshortcut");
        this.configFetch = require("./modules/config/HttpConfigFetch");
        this.tokenData = getTokenData();
    },
    initLogging () {
        // Adjust logging level
        configureLoggingLevels();
        // Create the LogCollector and register it as the global log transport.
        // It is done early to capture as much logs as possible. Captured logs
        // will be cached, before the JitsiMeetLogStorage gets ready (statistics
        // module is initialized).
        if (!this.logCollector && !loggingConfig.disableLogCollector) {
            this.logCollector = new LogCollector(new JitsiMeetLogStorage());
            Logger.addGlobalTransport(this.logCollector);
            JitsiMeetJS.addGlobalLogTransport(this.logCollector);
        }
    }
};

/**
 * If JWT token data it will be used for local user settings
 */
function setTokenData() {
    let localUser = APP.tokenData.caller;
    if(localUser) {
        APP.settings.setEmail((localUser.getEmail() || "").trim(), true);
        APP.settings.setAvatarUrl((localUser.getAvatarUrl() || "").trim());
        APP.settings.setDisplayName((localUser.getName() || "").trim(), true);
    }
}

function init() {
    setTokenData();
    // Initialize the conference URL handler
    APP.ConferenceUrl = new ConferenceUrl(window.location);
    // Clean up the URL displayed by the browser
    replaceHistoryState(APP.ConferenceUrl.getInviteUrl());

    // TODO The execution of the mobile app starts from react/index.native.js.
    // Similarly, the execution of the Web app should start from
    // react/index.web.js for the sake of consistency and ease of understanding.
    // Temporarily though because we are at the beginning of introducing React
    // into the Web app, allow the execution of the Web app to start from app.js
    // in order to reduce the complexity of the beginning step.
    require('./react');

    const isUIReady = APP.UI.start();
    if (isUIReady) {
        APP.conference.init({roomName: buildRoomName()}).then(() => {

            if (APP.logCollector) {
                // Start the LogCollector's periodic "store logs" task only if
                // we're in the conference and not on the welcome page. This is
                // determined by the value of "isUIReady" const above.
                APP.logCollector.start();
                APP.logCollectorStarted = true;
                // Make an attempt to flush in case a lot of logs have been
                // cached, before the collector was started.
                APP.logCollector.flush();

                // This event listener will flush the logs, before
                // the statistics module (CallStats) is stopped.
                //
                // NOTE The LogCollector is not stopped, because this event can
                // be triggered multiple times during single conference
                // (whenever statistics module is stopped). That includes
                // the case when Jicofo terminates the single person left in the
                // room. It will then restart the media session when someone
                // eventually join the room which will start the stats again.
                APP.conference.addConferenceListener(
                    ConferenceEvents.BEFORE_STATISTICS_DISPOSED,
                    () => {
                        if (APP.logCollector) {
                            APP.logCollector.flush();
                        }
                    }
                );
            }

            APP.UI.initConference();

            APP.UI.addListener(UIEvents.LANG_CHANGED, language => {
                APP.translation.setLanguage(language);
                APP.settings.setLanguage(language);
            });

            APP.keyboardshortcut.init();
        }).catch(err => {
            APP.UI.hideRingOverLay();
            APP.API.notifyConferenceLeft(APP.conference.roomName);
            logger.error(err);
        });
    }
}

/**
 * If we have an HTTP endpoint for getting config.json configured we're going to
 * read it and override properties from config.js and interfaceConfig.js.
 * If there is no endpoint we'll just continue with initialization.
 * Keep in mind that if the endpoint has been configured and we fail to obtain
 * the config for any reason then the conference won't start and error message
 * will be displayed to the user.
 */
function obtainConfigAndInit() {
    let roomName = APP.conference.roomName;

    if (config.configLocation) {
        APP.configFetch.obtainConfig(
            config.configLocation, roomName,
            // Get config result callback
            function(success, error) {
                if (success) {
                    var now = APP.connectionTimes["configuration.fetched"] =
                        window.performance.now();
                    logger.log("(TIME) configuration fetched:\t", now);
                    init();
                } else {
                    // Show obtain config error,
                    // pass the error object for report
                    APP.UI.messageHandler.openReportDialog(
                        null, "dialog.connectError", error);
                }
            });
    } else {
        require("./modules/config/BoshAddressChoice").chooseAddress(
            config, roomName);

        init();
    }
}


$(document).ready(function () {
    var now = APP.connectionTimes["document.ready"] = window.performance.now();
    logger.log("(TIME) document ready:\t", now);

    URLProcessor.setConfigParametersFromUrl();

    APP.init();

    APP.translation.init(settings.getLanguage());

    APP.API.init(APP.tokenData.externalAPISettings);

    obtainConfigAndInit();
});

$(window).bind('beforeunload', function () {
    // Stop the LogCollector
    if (APP.logCollectorStarted) {
        APP.logCollector.stop();
        APP.logCollectorStarted = false;
    }
    APP.API.dispose();
});

module.exports = APP;
