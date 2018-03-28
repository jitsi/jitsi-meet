// @flow

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import UIEvents from '../../../../../service/UI/UIEvents';
import {
    ACTION_SHORTCUT_TRIGGERED,
    AUDIO_MUTE,
    createShortcutEvent,
    sendAnalytics
} from '../../../analytics';
import { translate } from '../../../base/i18n';
import { MEDIA_TYPE } from '../../../base/media';
import { isLocalTrackMuted } from '../../../base/tracks';

import AbstractAudioMuteButton from './AbstractAudioMuteButton';
import ToolbarButtonV2 from '../ToolbarButtonV2';

declare var APP: Object;

/**
 * Component that renders a toolbar button for toggling audio mute.
 *
 * @extends Component
 */
export class AudioMuteButton extends AbstractAudioMuteButton {
    /**
     * Default values for {@code AudioMuteButton} component's properties.
     *
     * @static
     */
    static defaultProps = {
        tooltipPosition: 'top'
    };

    /**
     * {@code AudioMuteButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractAudioMuteButton.propTypes,

        /**
         * The {@code JitsiConference} for the current conference.
         */
        _conference: PropTypes.object,

        /**
         * Invoked to update the audio mute status.
         */
        dispatch: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func,

        /**
         * Where the tooltip should display, relative to the button.
         */
        tooltipPosition: PropTypes.string
    };

    /**
     * Initializes a new {@code AudioMuteButton} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        // Bind event handlers so it is only bound once per instance.
        this._onShortcutToggleAudio = this._onShortcutToggleAudio.bind(this);
    }

    /**
     * Sets a keyboard shortcuts for toggling audio mute.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        APP.keyboardshortcut.registerShortcut(
            'M',
            null,
            this._onShortcutToggleAudio,
            'keyboardShortcuts.mute');
    }

    /**
     * Removes the registered keyboard shortcut handler.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        APP.keyboardshortcut.unregisterShortcut('M');
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _audioMuted, _conference, t, tooltipPosition } = this.props;

        return (
            <ToolbarButtonV2
                iconName = { _audioMuted && _conference
                    ? 'icon-mic-disabled toggled'
                    : 'icon-microphone' }
                onClick = { this._onToolbarToggleAudio }
                tooltip = { t('toolbar.mute') }
                tooltipPosition = { tooltipPosition } />
        );
    }

    _doToggleAudio: () => void;

    /**
     * Emits an event to signal audio mute should be toggled.
     *
     * @private
     * @returns {void}
     */
    _doToggleAudio() {
        // The old conference logic must be used for now as the redux flows do
        // not handle all cases, such as unmuting when the config
        // startWithAudioMuted is true.
        APP.UI.emitEvent(UIEvents.AUDIO_MUTED, !this.props._audioMuted, true);
    }

    _onShortcutToggleAudio: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling audio mute.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleAudio() {
        sendAnalytics(createShortcutEvent(
            AUDIO_MUTE,
            ACTION_SHORTCUT_TRIGGERED,
            { enable: !this.props._audioMuted }));

        this._doToggleAudio();
    }

    _onToolbarToggleAudio: () => void;
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code AudioMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioMuted: boolean,
 *     _conference: Object,
 * }}
 */
function _mapStateToProps(state) {
    const tracks = state['features/base/tracks'];

    return {
        _audioMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO),
        _conference: state['features/base/conference'].conference
    };
}

export default translate(connect(_mapStateToProps)(AudioMuteButton));
