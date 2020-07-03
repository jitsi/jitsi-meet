// @flow

declare var interfaceConfig: Object;

/**
 * Function to decide which close page we wanna redirec the user after the meeting.
 *
 * @param {Object} options - Optional options object retreived from events that happened before
 * showing the close page (e.g. Feedback submittal).
 * @returns {string}
 */
export function getClosePage(options: Object = {}) {
    let path = 'close.html';

    if (typeof interfaceConfig === 'object' && interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE) {
        path = 'close3.html';
    } else if (!options.feedbackSubmitted) {
        path = 'close2.html';
    }

    return `static/${path}`;
}
