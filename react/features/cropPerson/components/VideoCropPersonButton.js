// @flow

import React from 'react';

import { createVideoCropPersonEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconCropForeground } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, BetaTag } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';

import { toggleCropPersonEffect } from '../actions';

/**
 * The type of the React {@code Component} props of {@link VideoCropPersonButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * True if the video foreground is cropped or false if it is not.
     */
    _isVideoCropped: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function

};

/**
 * An abstract implementation of a button that toggles the video crop effect.
 */
class VideoCropPersonButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.cropperson';
    icon = IconCropForeground;
    label = 'toolbar.startcropperson';
    tooltip = 'toolbar.startcropperson';
    toggledLabel = 'toolbar.stopcropperson';

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
     * Handles clicking / pressing the button, and toggles the crop effect
     * state accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _isVideoCropped, dispatch } = this.props;
        const value = !_isVideoCropped;

        sendAnalytics(createVideoCropPersonEvent(value ? 'started' : 'stopped'));
        dispatch(toggleCropPersonEffect(value));
    }

    /**
     * Returns {@code boolean} value indicating if the crop effect is
     * enabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isVideoCropped;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoCropPersonButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _isVideoCropped: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    return {
        _isVideoCropped: Boolean(state['features/cropPerson'].cropEnabled)
    };
}

export default translate(connect(_mapStateToProps)(VideoCropPersonButton));
