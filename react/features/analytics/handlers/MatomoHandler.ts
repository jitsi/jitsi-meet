/* global _paq */

import { getJitsiMeetGlobalNS } from '../../base/util/helpers';

import AbstractHandler, { IEvent } from './AbstractHandler';

/**
 * Analytics handler for Matomo.
 */
export default class MatomoHandler extends AbstractHandler {
    _userProperties: Object;

    /**
     * Creates new instance of the Matomo handler.
     *
     * @param {Object} options - The matomo options.
     * @param {string} options.matomoEndpoint - The Matomo endpoint.
     * @param {string} options.matomoSiteID   - The site ID.
     */
    constructor(options: any) {
        super(options);
        this._userProperties = {};

        if (!options.matomoEndpoint) {
            throw new Error(
                'Failed to initialize Matomo handler: no endpoint defined.'
            );
        }
        if (!options.matomoSiteID) {
            throw new Error(
                'Failed to initialize Matomo handler: no site ID defined.'
            );
        }

        this._enabled = true;
        this._initMatomo(options);
    }

    /**
     * Initializes the _paq object.
     *
     * @param {Object} options - The matomo options.
     * @param {string} options.matomoEndpoint - The Matomo endpoint.
     * @param {string} options.matomoSiteID   - The site ID.
     * @returns {void}
     */
    _initMatomo(options: any) {
        // @ts-ignore
        const _paq = window._paq || [];

        // @ts-ignore
        window._paq = _paq;

        _paq.push([ 'trackPageView' ]);
        _paq.push([ 'enableLinkTracking' ]);

        (function() {
            // add trailing slash if needed
            const u = options.matomoEndpoint.endsWith('/')
                ? options.matomoEndpoint
                : `${options.matomoEndpoint}/`;

            // configure the tracker
            _paq.push([ 'setTrackerUrl', `${u}matomo.php` ]);
            _paq.push([ 'setSiteId', options.matomoSiteID ]);

            // insert the matomo script
            const d = document,
                g = d.createElement('script'),
                s = d.getElementsByTagName('script')[0];

            g.type = 'text/javascript';
            g.async = true;
            g.defer = true;
            g.src = `${u}matomo.js`;
            s.parentNode?.insertBefore(g, s);
        })();
    }

    /**
     * Extracts the integer to use for a Matomo event's value field
     * from a lib-jitsi-meet analytics event.
     *
     * @param {Object} event - The lib-jitsi-meet analytics event.
     * @returns {number} - The integer to use for the 'value' of a Matomo
     * event, or NaN if the lib-jitsi-meet event doesn't contain a
     * suitable value.
     * @private
     */
    _extractValue(event: IEvent) {
        const value = event?.attributes?.value;

        // Try to extract an integer from the 'value' attribute.
        return Math.round(parseFloat(value ?? ''));
    }

    /**
     * Sets the permanent properties for the current session.
     *
     * @param {Object} userProps - The permanent properties.
     * @returns {void}
     */
    setUserProperties(userProps: any = {}) {
        if (!this._enabled) {
            return;
        }

        const visitScope = [ 'user_agent', 'callstats_name', 'browser_name' ];

        // add variables in the 'page' scope
        Object.keys(userProps)
            .filter(key => visitScope.indexOf(key) === -1)
            .forEach((key, index) => {
                // @ts-ignore
                _paq.push([
                    'setCustomVariable',
                    1 + index,
                    key,
                    userProps[key],
                    'page'
                ]);
            });


        // add variables in the 'visit' scope
        Object.keys(userProps)
            .filter(key => visitScope.indexOf(key) !== -1)
            .forEach((key, index) => {
                // @ts-ignore
                _paq.push([
                    'setCustomVariable',
                    1 + index,
                    key,
                    userProps[key],
                    'visit'
                ]);
            });
    }

    /**
     * This is the entry point of the API. The function sends an event to
     * the Matomo endpoint. The format of the event is described in
     * analyticsAdapter in lib-jitsi-meet.
     *
     * @param {Object} event - The event in the format specified by
     * lib-jitsi-meet.
     * @returns {void}
     */
    sendEvent(event: IEvent) {
        if (this._shouldIgnore(event)) {
            return;
        }

        const value = this._extractValue(event);
        const matomoEvent: Array<string | number | undefined> = [
            'trackEvent', 'jitsi-meet', this._extractName(event) ];

        if (!isNaN(value)) {
            matomoEvent.push(value);
        }

        // @ts-ignore
        _paq.push(matomoEvent);
    }
}

const globalNS = getJitsiMeetGlobalNS();

globalNS.analyticsHandlers = globalNS.analyticsHandlers || [];
globalNS.analyticsHandlers.push(MatomoHandler);
