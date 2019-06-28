// @flow

import { createVideoBlurEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { AbstractButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import {
    getJitsiMeetGlobalNS,
    loadScript
} from '../../base/util';

import { toggleBlurEffect } from '../actions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
    iconName = 'icon-blur-background';
    label = 'toolbar.startvideoblur';
    tooltip = 'toolbar.startvideoblur';
    toggledLabel = 'toolbar.stopvideoblur';

    /**
     * Handles clicking / pressing the button, and toggles the blur effect
     * state accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const {
            _isVideoBlurred,
            dispatch
        } = this.props;

        if (!getJitsiMeetGlobalNS().effects
            || !getJitsiMeetGlobalNS().effects.createBlurEffect) {

            loadScript('libs/video-blur-effect.min.js')
                .then(() => {
                    this._handleClick();
                })
                .catch(error => {
                    logger.error('Failed to load script with error: ', error);
                });

        } else {
            sendAnalytics(createVideoBlurEvent(_isVideoBlurred ? 'started' : 'stopped'));

            dispatch(toggleBlurEffect(!_isVideoBlurred));
        }
    }

    /**
     * Returns {@code boolean} value indicating if the blur effect is
     * enabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        const {
            _isVideoBlurred
        } = this.props;

        if (!getJitsiMeetGlobalNS().effects
            || !getJitsiMeetGlobalNS().effects.createBlurEffect) {
            return false;
        }

        return _isVideoBlurred;
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
