// @flow

import { translate } from '../../base/i18n';
import {
    IconVideoQualityAudioOnly,
    IconVideoQualityHD,
    IconVideoQualityLD,
    IconVideoQualitySD
} from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { VIDEO_QUALITY_LEVELS } from '../constants';
import { findNearestQualityLevel } from '../functions';

/**
 * A map of of selectable receive resolutions to corresponding icons.
 *
 * @private
 * @type {Object}
 */
const VIDEO_QUALITY_TO_ICON = {
    [VIDEO_QUALITY_LEVELS.ULTRA]: IconVideoQualityHD,
    [VIDEO_QUALITY_LEVELS.HIGH]: IconVideoQualityHD,
    [VIDEO_QUALITY_LEVELS.STANDARD]: IconVideoQualitySD,
    [VIDEO_QUALITY_LEVELS.LOW]: IconVideoQualityLD
};

/**
 * The type of the React {@code Component} props of
 * {@link VideoQualityButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether or not audio only mode is currently enabled.
     */
    _audioOnly: boolean,

    /**
     * The currently configured maximum quality resolution to be received from
     * and sent to remote participants.
     */
    _videoQuality: number,

    /**
     * Callback to invoke when {@link VideoQualityButton} is clicked.
     */
     handleClick: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React {@code Component} responsible for displaying a button in the overflow
 * menu of the toolbar, including an icon showing the currently selected
 * max receive quality.
 *
 * @extends Component
 */
class VideoQualityButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.callQuality';
    label = 'toolbar.callQuality';
    tooltip = 'toolbar.callQuality';

    /**
     * Dynamically retrieves the icon.
     */
    get icon() {
        const { _audioOnly, _videoQuality } = this.props;

        const videoQualityLevel = findNearestQualityLevel(_videoQuality);

        const icon = _audioOnly || !videoQualityLevel
            ? IconVideoQualityAudioOnly
            : VIDEO_QUALITY_TO_ICON[videoQualityLevel];

        return icon;
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} value - The icon value.
     */
    set icon(value) {
        return value;
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.handleClick();
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code VideoQualityButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _videoQuality: number
 * }}
 */
function _mapStateToProps(state) {
    return {
        _audioOnly: state['features/base/audio-only'].enabled,
        _videoQuality: state['features/video-quality'].preferredVideoQuality
    };
}

export default translate(
    connect(_mapStateToProps)(VideoQualityButton));
