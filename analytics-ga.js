/* global ga */

(function(ctx) {
    /**
     *
     */
    function Analytics(options) {
        /* eslint-disable */

        if (!options.googleAnalyticsTrackingId) {
            console.log(
                'Failed to initialize Google Analytics handler, no tracking ID');
             return;
        }

        /**
         * Google Analytics
         * TODO: Keep this local, there's no need to add it to window.
         */
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
        ga('create', options.googleAnalyticsTrackingId, 'auto');
        ga('send', 'pageview');

        /* eslint-enable */
    }

    /**
     * Extracts the integer to use for a Google Analytics event's value field
     * from a lib-jitsi-meet analytics event.
     * @param {Object} event - The lib-jitsi-meet analytics event.
     * @returns {Object} - The integer to use for the 'value' of a Google
     * Analytics event.
     * @private
     */
    Analytics.prototype._extractAction = function(event) {
        // Page events have a single 'name' field.
        if (event.type === 'page') {
            return event.name;
        }

        // All other events have action, actionSubject, and source fields. All
        // three fields are required, and the often jitsi-meet and
        // lib-jitsi-meet use the same value when separate values are not
        // necessary (i.e. event.action == event.actionSubject).
        // Here we concatenate these three fields, but avoid adding the same
        // value twice, because it would only make the GA event's action harder
        // to read.
        let action = event.action;

        if (event.actionSubject && event.actionSubject !== event.action) {
            // Intentionally use string concatenation as analytics needs to
            // work on IE but this file does not go through babel. For some
            // reason disabling this globally for the file does not have an
            // effect.
            // eslint-disable-next-line prefer-template
            action = event.actionSubject + '.' + action;
        }
        if (event.source && event.source !== event.action
                && event.source !== event.action) {
            // eslint-disable-next-line prefer-template
            action = event.source + '.' + action;
        }

        return action;
    };

    /**
     * Extracts the integer to use for a Google Analytics event's value field
     * from a lib-jitsi-meet analytics event.
     * @param {Object} event - The lib-jitsi-meet analytics event.
     * @returns {Object} - The integer to use for the 'value' of a Google
     * Analytics event, or NaN if the lib-jitsi-meet event doesn't contain a
     * suitable value.
     * @private
     */
    Analytics.prototype._extractValue = function(event) {
        let value = event && event.attributes && event.attributes.value;

        // Try to extract an integer from the "value" attribute.
        value = Math.round(parseFloat(value));

        return value;
    };

    /**
     * Extracts the string to use for a Google Analytics event's label field
     * from a lib-jitsi-meet analytics event.
     * @param {Object} event - The lib-jitsi-meet analytics event.
     * @returns {string} - The string to use for the 'label' of a Google
     * Analytics event.
     * @private
     */
    Analytics.prototype._extractLabel = function(event) {
        let label = '';

        // The label field is limited to 500B. We will concatenate all
        // attributes of the event, except the user agent because it may be
        // lengthy and is probably included from elsewhere.
        for (const property in event.attributes) {
            if (property !== 'permanent_user_agent'
                && property !== 'permanent_callstats_name'
                && event.attributes.hasOwnProperty(property)) {
                // eslint-disable-next-line prefer-template
                label += property + '=' + event.attributes[property] + '&';
            }
        }

        if (label.length > 0) {
            label = label.slice(0, -1);
        }

        return label;
    };

    /**
     * This is the entry point of the API. The function sends an event to
     * google analytics. The format of the event is described in
     * AnalyticsAdapter in lib-jitsi-meet.
     * @param {Object} event - the event in the format specified by
     * lib-jitsi-meet.
     */
    Analytics.prototype.sendEvent = function(event) {
        if (!event || !ga) {
            return;
        }

        const ignoredEvents
            = [ 'e2e_rtt', 'rtp.stats', 'rtt.by.region', 'available.device',
                'stream.switch.delay', 'ice.state.changed', 'ice.duration' ];

        // Temporary removing some of the events that are too noisy.
        if (ignoredEvents.indexOf(event.action) !== -1) {
            return;
        }

        const gaEvent = {
            'eventCategory': 'jitsi-meet',
            'eventAction': this._extractAction(event),
            'eventLabel': this._extractLabel(event)
        };
        const value = this._extractValue(event);

        if (!isNaN(value)) {
            gaEvent.eventValue = value;
        }

        ga('send', 'event', gaEvent);
    };

    if (typeof ctx.JitsiMeetJS === 'undefined') {
        ctx.JitsiMeetJS = {};
    }
    if (typeof ctx.JitsiMeetJS.app === 'undefined') {
        ctx.JitsiMeetJS.app = {};
    }
    if (typeof ctx.JitsiMeetJS.app.analyticsHandlers === 'undefined') {
        ctx.JitsiMeetJS.app.analyticsHandlers = [];
    }
    ctx.JitsiMeetJS.app.analyticsHandlers.push(Analytics);
})(window);
/* eslint-enable prefer-template */
