import { ClassNameMap, withStyles } from '@mui/styles';
import React, { ReactElement } from 'react';
import { connect } from 'react-redux';

import { ACTION_SHORTCUT_TRIGGERED, AUDIO_MUTE, createShortcutEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { AUDIO_MUTE_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { translate } from '../../base/i18n/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import { IGUMPendingState } from '../../base/media/types';
import AbstractAudioMuteButton from '../../base/toolbox/components/AbstractAudioMuteButton';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { isLocalTrackMuted } from '../../base/tracks/functions';
import Spinner from '../../base/ui/components/web/Spinner';
import { registerShortcut, unregisterShortcut } from '../../keyboard-shortcuts/actions';
import { muteLocal } from '../../video-menu/actions';
import { SPINNER_COLOR } from '../constants';
import { isAudioMuteButtonDisabled } from '../functions';

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
 * The type of the React {@code Component} props of {@link AudioMuteButton}.
 */
interface IProps extends AbstractButtonProps {


    /**
     * Whether audio is currently muted or not.
    */
   _audioMuted: boolean;

   /**
    * Whether the button is disabled.
   */
  _disabled: boolean;

  /**
   * The gumPending state from redux.
   */
  _gumPending: IGUMPendingState;

  /**
   * The @mui/styles classes.
   */
  classes: ClassNameMap<string>;
}

/**
 * Component that renders a toolbar button for toggling audio mute.
 *
 * @augments AbstractAudioMuteButton
 */
class AudioMuteButton extends AbstractAudioMuteButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.mute';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.unmute';
    label = 'toolbar.mute';
    tooltip = 'toolbar.mute';
    toggledTooltip = 'toolbar.unmute';

    /**
     * Initializes a new {@code AudioMuteButton} instance.
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
     * Registers the keyboard shortcut that toggles the audio muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        if (typeof APP === 'undefined') {
            return;
        }

        this.props.dispatch(registerShortcut({
            character: 'M',
            helpDescription: 'keyboardShortcuts.mute',
            handler: this._onKeyboardShortcut
        }));
    }

    /**
     * Unregisters the keyboard shortcut that toggles the audio muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        if (typeof APP === 'undefined') {
            return;
        }

        this.props.dispatch(unregisterShortcut('M'));
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

        return 'toolbar.accessibilityLabel.muteGUMPending';
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

        return 'toolbar.muteGUMPending';
    }

    /**
     * Indicates if audio is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isAudioMuted() {
        const { _audioMuted, _gumPending } = this.props;

        if (_gumPending === IGUMPendingState.PENDING_UNMUTE) {
            return false;
        }

        return _audioMuted;
    }

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action to
     * toggle the audio muting.
     *
     * @private
     * @returns {void}
     */
    _onKeyboardShortcut() {
        // Ignore keyboard shortcuts if the audio button is disabled.
        if (this._isDisabled()) {
            return;
        }

        sendAnalytics(
            createShortcutEvent(
                AUDIO_MUTE,
                ACTION_SHORTCUT_TRIGGERED,
                { enable: !this._isAudioMuted() }));

        AbstractButton.prototype._onClick.call(this);
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
     * Changes the muted state.
     *
     * @param {boolean} audioMuted - Whether audio should be muted or not.
     * @protected
     * @returns {void}
     */
    _setAudioMuted(audioMuted: boolean) {
        this.props.dispatch(muteLocal(audioMuted, MEDIA_TYPE.AUDIO));
    }

    /**
     * Return a boolean value indicating if this button is disabled or not.
     *
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._disabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AudioMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioMuted: boolean,
 *     _disabled: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const _audioMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO);
    const _disabled = isAudioMuteButtonDisabled(state);
    const enabledFlag = getFeatureFlag(state, AUDIO_MUTE_BUTTON_ENABLED, true);
    const { gumPending } = state['features/base/media'].audio;

    return {
        _audioMuted,
        _disabled,
        _gumPending: gumPending,
        visible: enabledFlag
    };
}

export default withStyles(styles)(translate(connect(_mapStateToProps)(AudioMuteButton)));
