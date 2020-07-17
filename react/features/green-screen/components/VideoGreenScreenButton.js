// @flow

import React from 'react';

import { createVideoGreenScreenEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconGreenScreenBackground } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, BetaTag } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import { toggleGreenScreenEffect } from '../actions';

/**
 * The type of the React {@code Component} props of {@link VideoGreenScreenButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * True if the video background is green screened or false if it is not.
     */
    _isVideoGreenScreen: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function

};

/**
 * An abstract implementation of a button that toggles the video green screen effect.
 */
class VideoGreenScreenButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.videogreenscreen';
    icon = IconGreenScreenBackground;
    label = 'toolbar.startvideogreenscreen';
    tooltip = 'toolbar.startvideogreenscreen';
    toggledLabel = 'toolbar.stopvideogreenscreen';

    /**
     * Helper function to be implemented by subclasses, which returns
     * a React Element to display (a beta tag) at the end of the button.
     *
     * @override
     * @protected
     * @returns {ReactElement}
     */
    _getElementAfter() {
        return <BetaTag />;
    }

    /**
     * Handles clicking / pressing the button, and toggles the green screen effect
     * state accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _isVideoGreenScreen, dispatch } = this.props;
        const value = !_isVideoGreenScreen;

        sendAnalytics(createVideoGreenScreenEvent(value ? 'started' : 'stopped'));
        dispatch(toggleGreenScreenEffect(value));
    }

    /**
     * Returns {@code boolean} value indicating if the green screen effect is
     * enabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isVideoGreenScreen;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoGreenScreenButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _isVideoGreenScreen: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    return {
        _isVideoGreenScreen: Boolean(state['features/green-screen/settings'].enabled)
    };
}

export default translate(connect(_mapStateToProps)(VideoGreenScreenButton));
