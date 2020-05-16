// @flow

import {
    ACTION_SHORTCUT_TRIGGERED,
    AUDIO_MUTE,
    createShortcutEvent,
    sendAnalytics
} from '../../analytics';
import { translate } from '../../base/i18n';
import { MEDIA_TYPE } from '../../base/media';
import { connect } from '../../base/redux';
import { AbstractAudioMuteButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import { isLocalTrackMuted } from '../../base/tracks';
import {
    isPrejoinAudioMuted,
    isAudioDisabled,
    isPrejoinPageVisible
} from '../../prejoin/functions';
import { muteLocal } from '../../remote-video-menu/actions';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link AudioMuteButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether audio is currently muted or not.
     */
    _audioMuted: boolean,

    /**
     * Whether the button is disabled.
     */
    _disabled: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
}

/**
 * Component that renders a toolbar button for toggling audio mute.
 *
 * @extends AbstractAudioMuteButton
 */
class AudioMuteButton extends AbstractAudioMuteButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.mute';
    label = 'toolbar.mute';
    tooltip = 'toolbar.mute';

    /**
     * Initializes a new {@code AudioMuteButton} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
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
     * Indicates if audio is currently muted ot nor.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isAudioMuted() {
        return this.props._audioMuted;
    }

    _onKeyboardShortcut: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action to
     * toggle the audio muting.
     *
     * @private
     * @returns {void}
     */
    _onKeyboardShortcut() {
        sendAnalytics(
            createShortcutEvent(
                AUDIO_MUTE,
                ACTION_SHORTCUT_TRIGGERED,
                { enable: !this._isAudioMuted() }));

        super._handleClick();
    }

    /**
     * Changes the muted state.
     *
     * @param {boolean} audioMuted - Whether audio should be muted or not.
     * @protected
     * @returns {void}
     */
    _setAudioMuted(audioMuted: boolean) {
        this.props.dispatch(muteLocal(audioMuted));
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
function _mapStateToProps(state): Object {
    let _audioMuted;
    let _disabled;

    if (isPrejoinPageVisible(state)) {
        _audioMuted = isPrejoinAudioMuted(state);
        _disabled = state['features/base/config'].startSilent;
    } else {
        const tracks = state['features/base/tracks'];

        _audioMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);
        _disabled = state['features/base/config'].startSilent || isAudioDisabled(state);
    }

    return {
        _audioMuted,
        _disabled
    };
}

export default translate(connect(_mapStateToProps)(AudioMuteButton));
