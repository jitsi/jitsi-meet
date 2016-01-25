/* global config JitsiMeetJS */

// Load the integration of a third-party analytics API such as Google Analytics.
// Since we cannot guarantee the quality of the third-party service (e.g. their
// server may take noticeably long time to respond), it is in our best interest
// (in the sense that the intergration of the analytics API is important to us
// but not enough to allow it to prevent people from joining a conference) to
// download the API asynchronously. Additionally, Google Analytics will download
// its implementation asynchronously anyway so it makes sense to append the
// loading on our side rather than prepend it.
if (config.disableThirdPartyRequests !== true) {
    JitsiMeetJS.util.ScriptUtil.loadScript(
            'analytics.js?v=1',
            /* async */ true,
            /* prepend */ false);
}

class NoopAnalytics {
    sendEvent () {}
}

// XXX Since we asynchronously load the integration of the analytics API and the
// analytics API may asynchronously load its implementation (e.g. Google
// Analytics), we cannot make the decision with respect to which analytics
// implementation we will use here and we have to postpone it i.e. we will make
// a lazy decision.

class AnalyticsAdapter {
    constructor () {
    }

    sendEvent (...args) {
        var a = this.analytics;

        if (a === null || typeof a === 'undefined') {
            var AnalyticsImpl = window.Analytics || NoopAnalytics;

            this.analytics = a = new AnalyticsImpl();
        }
        try {
            a.sendEvent(...args);
        } catch (ignored) {}
    }
}

export default new AnalyticsAdapter();
