import { connect } from 'react-redux';

import { ACTION_SHORTCUT_TRIGGERED, AUDIO_MUTE, createShortcutEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { AUDIO_MUTE_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { translate } from '../../base/i18n/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import AbstractAudioMuteButton from '../../base/toolbox/components/AbstractAudioMuteButton';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { isLocalTrackMuted } from '../../base/tracks/functions';
import { muteLocal } from '../../video-menu/actions';
import { isAudioMuteButtonDisabled } from '../functions';

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
    }

    /**
     * Registers the keyboard shortcut that toggles the audio muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        typeof APP === 'undefined'
            || APP.keyboardshortcut.registerShortcut(
                'M',
                null,
                this._onKeyboardShortcut,
                'keyboardShortcuts.mute');
    }

    /**
     * Unregisters the keyboard shortcut that toggles the audio muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        typeof APP === 'undefined'
            || APP.keyboardshortcut.unregisterShortcut('M');
    }

    /**
     * Indicates if audio is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isAudioMuted() {
        return this.props._audioMuted;
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

    return {
        _audioMuted,
        _disabled,
        visible: enabledFlag
    };
}

export default translate(connect(_mapStateToProps)(AudioMuteButton));
