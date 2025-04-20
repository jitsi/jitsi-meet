/** Event object
 *
 * {
 *    type,
 *
 *    action,
 *    actionSubject,
 *    actionSubjectId,
 *    attributes,
 *    categories,
 *    containerId,
 *    containerType,
 *    name,
 *    objectId,
 *    objectType,
 *    source,
 *    tags
 * }
 *
 * The 'type' is one of 'operational', 'page', 'track' or 'ui', and some of the
 * other properties are considered required according to the type.
 *
 * For events with type 'page', the required properties are: name.
 *
 * For events with type 'operational' and 'ui', the required properties are:
 * action, actionSubject, source
 *
 * For events with type 'track', the required properties are:
 * action, actionSubject, source, containerType, containerId, objectType,
 * objectId
 */

// handlerConstructorOptions = {
//     amplitudeAPPKey,
//     amplitudeIncludeUTM,
//     blackListedEvents,
//     envType: deploymentInfo?.envType || 'dev',
//     matomoEndpoint,
//     matomoSiteID,
//     group,
//     host,
//     product: deploymentInfo?.product,
//     subproduct: deploymentInfo?.environment,
//     user: user?.id,
//     version: JitsiMeetJS.version,
//     whiteListedEvents
// }

/**
 * EventSaver
 *
 * @param {Object} handlerConstructorOptions
 */
class EventSaver {
    /**
     * @param {Object} handlerConstructorOptions
     * @returns {void}
     */
    constructor(handlerConstructorOptions) {
        console.log('EventSaver PostHog created');
        this.handlerConstructorOptions = handlerConstructorOptions;
    }

    /**
     * @param {Object} userProperties
     * @returns {void}
     */
    setUserProperties(userProperties) {
        // if (window.posthog) {
        //     window.posthog.identify(userProperties.id, userProperties);
        // }
    }

    /**
     * @param {Object} event
     * @returns {void}
     */
    sendEvent(event) {
        if (window.posthog) {
            window.posthog.capture(event.type, event);
        }
    }

    /**
     * @returns {void}
     */
    dispose() {
        // if (window.posthog) {
        //     window.posthog.reset();
        // }
    }
}

if (window.JitsiMeetJS.app.analyticsHandlers) {
    window.JitsiMeetJS.app.analyticsHandlers.push(EventSaver);
}
