// @flow

import {
    ACTION_SHORTCUT_TRIGGERED,
    PRESENTER_MUTE,
    createShortcutEvent,
    createToolbarEvent,
    sendAnalytics
} from '../../analytics';
import { setAudioOnly } from '../../base/audio-only';
import { translate } from '../../base/i18n';
import {
    MEDIA_TYPE,
    VIDEO_MUTISM_AUTHORITY,
    setPresenterMuted
} from '../../base/media';
import { connect } from '../../base/redux';
import { AbstractPresenterMuteButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import { isLocalTrackMuted } from '../../base/tracks';
import UIEvents from '../../../../service/UI/UIEvents';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link PresenterMuteButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether the current conference is in audio only mode or not.
     */
    _audioOnly: boolean,

    /**
     * Whether presenter video is currently muted or not.
     */
    _presenterMuted: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
}

/**
 * Component that renders a toolbar button for toggling presenter mute.
 *
 * @extends AbstractPresenterMuteButton
 */
class PresenterMuteButton extends AbstractPresenterMuteButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.presenterMute';
    label = 'toolbar.presenterMute';
    tooltip = 'toolbar.presenterMute';

    /**
     * Initializes a new {@code PresenterMuteButton} instance.
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
     * Registers the keyboard shortcut that toggles the presenter muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        typeof APP === 'undefined'
            || APP.keyboardshortcut.registerShortcut(
                'V',
                null,
                this._onKeyboardShortcut,
                'keyboardShortcuts.presenterMute');
    }

    /**
     * Unregisters the keyboard shortcut that toggles the presenter muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        typeof APP === 'undefined'
            || APP.keyboardshortcut.unregisterShortcut('V');
    }

    /**
     * Indicates if presenter is currently muted ot nor.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isPresenterMuted() {
        return this.props._presenterMuted;
    }

    _onKeyboardShortcut: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action to
     * toggle the presenter muting.
     *
     * @private
     * @returns {void}
     */
    _onKeyboardShortcut() {
        sendAnalytics(
            createShortcutEvent(
                PRESENTER_MUTE,
                ACTION_SHORTCUT_TRIGGERED,
                { enable: !this._isPresenterMuted() }));

        super._handleClick();
    }

    /**
     * Changes the muted state.
     *
     * @override
     * @param {boolean} presenterMuted - Whether presenter should be muted or not.
     * @protected
     * @returns {void}
     */
    _setPresenterMuted(presenterMuted: boolean) {
        sendAnalytics(createToolbarEvent(PRESENTER_MUTE, { enable: presenterMuted }));
        if (this.props._audioOnly) {
            this.props.dispatch(
                setAudioOnly(false, /* ensureTrack */ true));
        }

        this.props.dispatch(
            setPresenterMuted(
                presenterMuted,
                VIDEO_MUTISM_AUTHORITY.USER,
                /* ensureTrack */ true));

        // FIXME: The old conference logic still relies on this event being
        // emitted.
        typeof APP === 'undefined'
            || APP.UI.emitEvent(UIEvents.PRESENTER_MUTED, presenterMuted, true);
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code PresenterMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _videoMuted: boolean,
 *     _presenterMuted: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const tracks = state['features/base/tracks'];

    return {
        _audioOnly: Boolean(audioOnly),
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),
        _presenterMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.PRESENTER)
    };
}

export default translate(connect(_mapStateToProps)(PresenterMuteButton));
