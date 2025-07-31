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

if (typeof window.EventSaver === 'undefined') {
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
        setUserProperties(_userProperties) {
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
         * Cleans up PostHog analytics state (e.g., resets identity).
         *
         * @returns {void}
         */
        dispose() {
            // if (window.posthog) {
            //     window.posthog.reset();
            // }
        }
    }

    // Store the class globally to prevent redeclaration
    window.EventSaver = EventSaver;
}

if (window.JitsiMeetJS.app.analyticsHandlers) {
    // Check if EventSaver is already in the handlers array to prevent duplicates
    const isAlreadyAdded = window.JitsiMeetJS.app.analyticsHandlers.some(
        handler => handler === window.EventSaver || handler.name === 'EventSaver'
    );

    if (!isAlreadyAdded) {
        window.JitsiMeetJS.app.analyticsHandlers.push(window.EventSaver);
    }
}
