/* global $, config, loggingConfig, JitsiMeetJS */
/* application specific logic */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import "babel-polyfill";
import "jquery";
import "jquery-contextmenu";
import "jquery-ui";
import "strophe";
import "strophe-disco";
import "strophe-caps";
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

import UI from "./modules/UI/UI";
import settings from "./modules/settings/Settings";
import conference from './conference';
import ConferenceUrl from './modules/URL/ConferenceUrl';
import API from './modules/API/API';

import getTokenData from "./modules/tokendata/TokenData";
import translation from "./modules/translation/translation";

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

    // TODO The execution of the mobile app starts from react/index.native.js.
    // Similarly, the execution of the Web app should start from
    // react/index.web.js for the sake of consistency and ease of understanding.
    // Temporarily though because we are at the beginning of introducing React
    // into the Web app, allow the execution of the Web app to start from app.js
    // in order to reduce the complexity of the beginning step.
    require('./react');
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
