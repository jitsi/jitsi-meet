// @flow

import React from 'react';

import { createVideoBlurEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconBlurBackground } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, BetaTag } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';

import { toggleBlurEffect } from '../actions';

/**
 * The type of the React {@code Component} props of {@link VideoBlurButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * True if the video background is blurred or false if it is not.
     */
    _isVideoBlurred: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function

};

/**
 * An abstract implementation of a button that toggles the video blur effect.
 */
class VideoBlurButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.videoblur';
    icon = IconBlurBackground;
    label = 'toolbar.startvideoblur';
    tooltip = 'toolbar.startvideoblur';
    toggledLabel = 'toolbar.stopvideoblur';

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
     * Handles clicking / pressing the button, and toggles the blur effect
     * state accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _isVideoBlurred, dispatch } = this.props;
        const value = !_isVideoBlurred;

        sendAnalytics(createVideoBlurEvent(value ? 'started' : 'stopped'));
        dispatch(toggleBlurEffect(value));
    }

    /**
     * Returns {@code boolean} value indicating if the blur effect is
     * enabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isVideoBlurred;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoBlurButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _isVideoBlurred: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    return {
        _isVideoBlurred: Boolean(state['features/blur'].blurEnabled)
    };
}

export default translate(connect(_mapStateToProps)(VideoBlurButton));
