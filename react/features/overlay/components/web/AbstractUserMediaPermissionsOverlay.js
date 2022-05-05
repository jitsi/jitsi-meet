// @flow

import { Component } from 'react';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractUserMediaPermissionsOverlay}.
 */
type Props = {

    /**
     * The browser which is used currently. The text is different for every
     * browser.
     */
    browser: string,

    mediaOverlayTitle: string,
    mediaOverlayText: string,

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

/**
 * Implements a React {@link Component} for overlay with guidance how to proceed
 * with gUM prompt.
 */
export default class AbstractUserMediaPermissionsOverlay
    extends Component<Props> {
    /**
     * Determines whether this overlay needs to be rendered (according to a
     * specific redux state). Called by {@link OverlayContainer}.
     *
     * @param {Object} state - The redux state.
     * @returns {boolean} - If this overlay needs to be rendered, {@code true};
     * {@code false}, otherwise.
     */
    static needsRender(state: Object) {
        return state['features/overlay'].isMediaPermissionPromptVisible;
    }
}

/**
 * Maps (parts of) the redux state to the associated component's props.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {{
 *     browser: string
 * }}
 */
export function abstractMapStateToProps(state: Object) {
    const { browser, mediaOverlayTitle, mediaOverlayText } = state['features/overlay'];

    return {
        browser,
        mediaOverlayTitle,
        mediaOverlayText
    };
}
