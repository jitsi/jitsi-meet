/* global JitsiMeetJS, config, APP */

/**
 * Load the integration of a third-party analytics API such as Google
 * Analytics. Since we cannot guarantee the quality of the third-party service
 * (e.g. their server may take noticeably long time to respond), it is in our
 * best interest (in the sense that the intergration of the analytics API is
 * important to us but not enough to allow it to prevent people from joining
 * a conference) to download the API asynchronously. Additionally, Google
 * Analytics will download its implementation asynchronously anyway so it makes
 * sense to append the loading on our side rather than prepend it.
 * @param {string} url the url to be loaded
 * @returns {Promise} resolved with no arguments when the script is loaded and
 * rejected with the error from JitsiMeetJS.ScriptUtil.loadScript method
 */
function loadScript(url) {
    return new Promise((resolve, reject) =>
        JitsiMeetJS.util.ScriptUtil.loadScript(
            url,
            /* async */ true,
            /* prepend */ false,
            /* relativeURL */ false,
            /* loadCallback */ () => resolve(),
            /* errorCallback */ error => reject(error)));
}

/**
 * Handles the initialization of analytics.
 */
class Analytics {
    constructor() {
        this._scriptURLs = Array.isArray(config.analyticsScriptUrls)
            ? config.analyticsScriptUrls : [];
        this._enabled = !!this._scriptURLs.length
            && !config.disableThirdPartyRequests;
        window.analyticsHandlers = [];
        const machineId = JitsiMeetJS.getMachineId();
        this._handlerConstructorOptions = {
            product: "lib-jitsi-meet",
            version: JitsiMeetJS.version,
            session: machineId,
            user:  "uid-" + machineId
        };
    }

    /**
     * Returns whether analytics is enabled or not.
     * @returns {boolean} whether analytics is enabled or not.
     */
    isEnabled() {
        return this._enabled;
    }

    /**
     * Tries to load the scripts for the analytics handlers.
     * @returns {Promise} resolves with the handlers that have been
     * successfully loaded and rejects if there are no handlers loaded or the
     * analytics is disabled.
     */
    _loadHandlers() {
        if(!this.isEnabled()) {
            return Promise.reject(new Error("Analytics is disabled!"));
        }
        let handlersPromises = [];
        this._scriptURLs.forEach(url =>
            handlersPromises.push(
                loadScript(url).then(
                    () => {
                        return {type: "success"};
                    },
                    error => {
                        return {type: "error", error, url};
                    }))
        );
        return new Promise((resolve, reject) =>
        {
            Promise.all(handlersPromises).then(values => {
                values.forEach(el => {
                    if(el.type === "error") {
                        console.log("Fialed to load " + el.url);
                        console.error(el.error);
                    }
                });

                if(window.analyticsHandlers.length === 0) {
                    reject(new Error("No analytics handlers available"));
                } else {
                    let handlerInstances = [];
                    window.analyticsHandlers.forEach(
                        Handler => handlerInstances.push(
                            new Handler(this._handlerConstructorOptions)));
                    resolve(handlerInstances);
                }
            });
        });
    }

    /**
     * Loads the analytics scripts and inits JitsiMeetJS.analytics by setting
     * permanent properties and setting the handlers from the loaded scripts.
     * NOTE: Has to be used after JitsiMeetJS.init. Otherwise analytics will be
     * null.
     */
    init() {
        const { analytics } = JitsiMeetJS;

        if (!this.isEnabled() || !analytics)
            return;

        this._loadHandlers().then(
            handlers => {
                const permanentProperties = {
                    roomName: APP.conference.roomName,
                    userAgent: navigator.userAgent
                };

                const { group, server } = APP.store.getState()['features/jwt'];

                if (server) {
                    permanentProperties.server = server;
                }
                if (group) {
                    permanentProperties.group = group;
                }

                analytics.addPermanentProperties(permanentProperties);
                analytics.setAnalyticsHandlers(handlers);
            },
            error => analytics.dispose() && console.error(error));

    }
}

export default new Analytics();
