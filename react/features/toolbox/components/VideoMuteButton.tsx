import { ClassNameMap, withStyles } from '@mui/styles';
import React, { ReactElement } from 'react';
import { connect } from 'react-redux';

import { ACTION_SHORTCUT_TRIGGERED, VIDEO_MUTE, createShortcutEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { VIDEO_MUTE_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { translate } from '../../base/i18n/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import { IGUMPendingState } from '../../base/media/types';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import AbstractVideoMuteButton from '../../base/toolbox/components/AbstractVideoMuteButton';
import { isLocalTrackMuted } from '../../base/tracks/functions';
import Spinner from '../../base/ui/components/web/Spinner';
import { registerShortcut, unregisterShortcut } from '../../keyboard-shortcuts/actions';
import { handleToggleVideoMuted } from '../actions.any';
import { SPINNER_COLOR } from '../constants';
import { isVideoMuteButtonDisabled } from '../functions';

const styles = () => {
    return {
        pendingContainer: {
            position: 'absolute' as const,
            bottom: '3px',
            right: '3px'
        }
    };
};

/**
 * The type of the React {@code Component} props of {@link VideoMuteButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * The gumPending state from redux.
     */
    _gumPending: IGUMPendingState;

    /**
     * Whether video button is disabled or not.
     */
    _videoDisabled: boolean;

    /**
     * Whether video is currently muted or not.
     */
    _videoMuted: boolean;

    /**
     * The @mui/styles classes.
     */
    classes: ClassNameMap<string>;
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
        this._getTooltip = this._getLabel;
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
     * Gets the current accessibility label, taking the toggled and GUM pending state into account. If no toggled label
     * is provided, the regular accessibility label will also be used in the toggled state.
     *
     * The accessibility label is not visible in the UI, it is meant to be used by assistive technologies, mainly screen
     * readers.
     *
     * @private
     * @returns {string}
     */
    _getAccessibilityLabel() {
        const { _gumPending } = this.props;

        if (_gumPending === IGUMPendingState.NONE) {
            return super._getAccessibilityLabel();
        }

        return 'toolbar.accessibilityLabel.videomuteGUMPending';
    }

    /**
     * Gets the current label, taking the toggled and GUM pending state into account. If no
     * toggled label is provided, the regular label will also be used in the toggled state.
     *
     * @private
     * @returns {string}
     */
    _getLabel() {
        const { _gumPending } = this.props;

        if (_gumPending === IGUMPendingState.NONE) {
            return super._getLabel();
        }

        return 'toolbar.videomuteGUMPending';
    }

    /**
     * Indicates if video is currently disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._videoDisabled || this.props._gumPending !== IGUMPendingState.NONE;
    }

    /**
     * Indicates if video is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isVideoMuted() {
        const { _gumPending, _videoMuted } = this.props;

        if (_gumPending === IGUMPendingState.PENDING_UNMUTE) {
            return false;
        }

        return _videoMuted;
    }

    /**
     * Returns a spinner if there is pending GUM.
     *
     * @returns {ReactElement | null}
     */
    _getElementAfter(): ReactElement | null {
        const { _gumPending, classes } = this.props;

        return _gumPending === IGUMPendingState.NONE ? null
            : (
                <div className = { classes.pendingContainer }>
                    <Spinner
                        color = { SPINNER_COLOR }
                        size = 'small' />
                </div>
            );
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
    const { gumPending } = state['features/base/media'].video;

    return {
        _videoDisabled: isVideoMuteButtonDisabled(state),
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),
        _gumPending: gumPending,
        visible: enabledFlag
    };
}

export default withStyles(styles)(translate(connect(_mapStateToProps)(VideoMuteButton)));
