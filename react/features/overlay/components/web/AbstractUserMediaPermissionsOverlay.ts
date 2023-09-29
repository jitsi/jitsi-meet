import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState } from '../../../app/types';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractUserMediaPermissionsOverlay}.
 */
interface IProps extends WithTranslation {

    _premeetingBackground?: any;

    /**
     * The browser which is used currently. The text is different for every
     * browser.
     */
    browser?: string;
}

/**
 * Implements a React {@link Component} for overlay with guidance how to proceed
 * with gUM prompt.
 */
export default class AbstractUserMediaPermissionsOverlay
    extends Component<IProps> {
    /**
     * Determines whether this overlay needs to be rendered (according to a
     * specific redux state). Called by {@link OverlayContainer}.
     *
     * @param {Object} state - The redux state.
     * @returns {boolean} - If this overlay needs to be rendered, {@code true};
     * {@code false}, otherwise.
     */
    static needsRender(state: IReduxState) {
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
export function abstractMapStateToProps(state: IReduxState) {
    const { browser } = state['features/overlay'];

    return {
        browser
    };
}
