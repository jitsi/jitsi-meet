import { connect } from 'react-redux';

import { ACTION_SHORTCUT_TRIGGERED, VIDEO_MUTE, createShortcutEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { VIDEO_MUTE_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { translate } from '../../base/i18n/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import AbstractVideoMuteButton from '../../base/toolbox/components/AbstractVideoMuteButton';
import { isLocalTrackMuted } from '../../base/tracks/functions';
import { registerShortcut, unregisterShortcut } from '../../keyboard-shortcuts/actions';
import { handleToggleVideoMuted } from '../actions.any';
import { isVideoMuteButtonDisabled } from '../functions';

/**
 * The type of the React {@code Component} props of {@link VideoMuteButton}.
 */
interface IProps extends AbstractButtonProps {


    /**
     * Whether video button is disabled or not.
     */
    _videoDisabled: boolean;

    /**
     * Whether video is currently muted or not.
     */
    _videoMuted: boolean;
}

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @augments AbstractVideoMuteButton
 */
class VideoMuteButton extends AbstractVideoMuteButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.videomute';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.videounmute';
    label = 'toolbar.videomute';
    tooltip = 'toolbar.videomute';
    toggledTooltip = 'toolbar.videounmute';

    /**
     * Initializes a new {@code VideoMuteButton} instance.
     *
     * @param {IProps} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onKeyboardShortcut = this._onKeyboardShortcut.bind(this);
    }

    /**
     * Registers the keyboard shortcut that toggles the video muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        if (typeof APP === 'undefined') {
            return;
        }

        this.props.dispatch(registerShortcut({
            character: 'V',
            helpDescription: 'keyboardShortcuts.videoMute',
            handler: this._onKeyboardShortcut
        }));
    }

    /**
     * Unregisters the keyboard shortcut that toggles the video muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        if (typeof APP === 'undefined') {
            return;
        }

        this.props.dispatch(unregisterShortcut('V'));
    }

    /**
     * Indicates if video is currently disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._videoDisabled;
    }

    /**
     * Indicates if video is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isVideoMuted() {
        return this.props._videoMuted;
    }

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action to
     * toggle the video muting.
     *
     * @private
     * @returns {void}
     */
    _onKeyboardShortcut() {
        // Ignore keyboard shortcuts if the video button is disabled.
        if (this._isDisabled()) {
            return;
        }

        sendAnalytics(
            createShortcutEvent(
                VIDEO_MUTE,
                ACTION_SHORTCUT_TRIGGERED,
                { enable: !this._isVideoMuted() }));

        AbstractButton.prototype._onClick.call(this);
    }

    /**
     * Changes the muted state.
     *
     * @override
     * @param {boolean} videoMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setVideoMuted(videoMuted: boolean) {
        this.props.dispatch(handleToggleVideoMuted(videoMuted, true, true));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const tracks = state['features/base/tracks'];
    const enabledFlag = getFeatureFlag(state, VIDEO_MUTE_BUTTON_ENABLED, true);

    return {
        _videoDisabled: isVideoMuteButtonDisabled(state),
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),
        visible: enabledFlag
    };
}

export default translate(connect(_mapStateToProps)(VideoMuteButton));
