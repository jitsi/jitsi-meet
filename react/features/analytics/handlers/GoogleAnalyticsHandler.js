/* global ga */

import { getJitsiMeetGlobalNS } from '../../base/util';

import AbstractHandler from './AbstractHandler';

/**
 * Analytics handler for Google Analytics.
 */
class GoogleAnalyticsHandler extends AbstractHandler {

    /**
     * Creates new instance of the GA analytics handler.
     *
     * @param {Object} options -
     * @param {string} options.googleAnalyticsTrackingId - The GA track id
     * required by the GA API.
     */
    constructor(options) {
        super(options);

        this._userProperties = {};

        if (!options.googleAnalyticsTrackingId) {
            throw new Error('Failed to initialize Google Analytics handler, no tracking ID');
        }

        this._enabled = true;
        this._initGoogleAnalytics(options);
    }

    /**
     * Initializes the ga object.
     *
     * @param {Object} options -
     * @param {string} options.googleAnalyticsTrackingId - The GA track id
     * required by the GA API.
     * @returns {void}
     */
    _initGoogleAnalytics(options) {
        /**
         * TODO: Keep this local, there's no need to add it to window.
         */
        /* eslint-disable */
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
        /* eslint-enable */
        ga('create', options.googleAnalyticsTrackingId, 'auto');
        ga('send', 'pageview');
    }

    /**
     * Extracts the integer to use for a Google Analytics event's value field
     * from a lib-jitsi-meet analytics event.
     *
     * @param {Object} event - The lib-jitsi-meet analytics event.
     * @returns {number} - The integer to use for the 'value' of a Google
     * analytics event, or NaN if the lib-jitsi-meet event doesn't contain a
     * suitable value.
     * @private
     */
    _extractValue(event) {
        let value = event && event.attributes && event.attributes.value;

        // Try to extract an integer from the "value" attribute.
        value = Math.round(parseFloat(value));

        return value;
    }

    /**
     * Extracts the string to use for a Google Analytics event's label field
     * from a lib-jitsi-meet analytics event.
     *
     * @param {Object} event - The lib-jitsi-meet analytics event.
     * @returns {string} - The string to use for the 'label' of a Google
     * analytics event.
     * @private
     */
    _extractLabel(event) {
        const { attributes = {} } = event;
        const labelsArray
            = Object.keys(attributes).map(key => `${key}=${attributes[key]}`);

        labelsArray.push(this._userPropertiesString);

        return labelsArray.join('&');
    }

    /**
     * Sets the permanent properties for the current session.
     *
     * @param {Object} userProps - The permanent portperties.
     * @returns {void}
     */
    setUserProperties(userProps = {}) {
        if (!this._enabled) {
            return;
        }

        // The label field is limited to 500B. We will concatenate all
        // attributes of the event, except the user agent because it may be
        // lengthy and is probably included from elsewhere.
        const filter = [ 'user_agent', 'callstats_name' ];

        this._userPropertiesString
            = Object.keys(userProps)
                .filter(key => filter.indexOf(key) === -1)
                .map(key => `permanent_${key}=${userProps[key]}`)
                .join('&');
    }

    /**
     * This is the entry point of the API. The function sends an event to
     * google analytics. The format of the event is described in
     * analyticsAdapter in lib-jitsi-meet.
     *
     * @param {Object} event - The event in the format specified by
     * lib-jitsi-meet.
     * @returns {void}
     */
    sendEvent(event) {
        if (this._shouldIgnore(event)) {
            return;
        }

        const gaEvent = {
            'eventCategory': 'jitsi-meet',
            'eventAction': this._extractName(event),
            'eventLabel': this._extractLabel(event)
        };
        const value = this._extractValue(event);

        if (!isNaN(value)) {
            gaEvent.eventValue = value;
        }

        ga('send', 'event', gaEvent);
    }

}

const globalNS = getJitsiMeetGlobalNS();

globalNS.analyticsHandlers = globalNS.analyticsHandlers || [];
globalNS.analyticsHandlers.push(GoogleAnalyticsHandler);
