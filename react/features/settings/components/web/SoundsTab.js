// @flow

import Checkbox from '@atlaskit/checkbox';
import React from 'react';

import { AbstractDialogTab } from '../../../base/dialog';
import type { Props as AbstractDialogTabProps } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link SoundsTab}.
 */
export type Props = {
    ...$Exact<AbstractDialogTabProps>,

    /**
     * Whether or not the sound for the incoming message should play.
     */
    soundsIncomingMessage: Boolean,

    /**
     * Whether or not the sound for the participant joined should play.
     */
    soundsParticipantJoined: Boolean,

    /**
     * Whether or not the sound for the participant left should play.
     */
    soundsParticipantLeft: Boolean,

    /**
     * Whether or not the sound for the talk while muted notification should play.
     */
    soundsTalkWhileMuted: Boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * React {@code Component} for modifying the local user's profile.
 *
 * @extends Component
 */
class SoundsTab extends AbstractDialogTab<Props> {
    /**
     * Initializes a new {@code ConnectedSettingsDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code ConnectedSettingsDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onIncomingMessageChange = this._onIncomingMessageChange.bind(this);
        this._onParticipantJoinedChange = this._onParticipantJoinedChange.bind(this);
        this._onParticipantLeftChange = this._onParticipantLeftChange.bind(this);
        this._onTalkWhileMutedChange = this._onTalkWhileMutedChange.bind(this);
    }

    _onIncomingMessageChange: (Object) => void;

    _onParticipantJoinedChange: (Object) => void;

    _onParticipantLeftChange: (Object) => void;

    _onTalkWhileMutedChange: (Object) => void;

    /**
     * Changes incoming message sound state.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onIncomingMessageChange({ target: { checked } }) {
        super._onChange({ soundsIncomingMessage: checked });
    }

    /**
     * Changes participant joined sound state.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onParticipantJoinedChange({ target: { checked } }) {
        super._onChange({ soundsParticipantJoined: checked });
    }

    /**
     * Changes participant left sound state.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onParticipantLeftChange({ target: { checked } }) {
        super._onChange({ soundsParticipantLeft: checked });
    }

    /**
     * Changes talk while muted sound state.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onTalkWhileMutedChange({ target: { checked } }) {
        super._onChange({ soundsTalkWhileMuted: checked });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            soundsIncomingMessage,
            soundsParticipantJoined,
            soundsParticipantLeft,
            soundsTalkWhileMuted,
            t
        } = this.props;

        return (
            <div
                className = 'settings-sub-pane-element'
                key = 'sounds'>
                <h2 className = 'mock-atlaskit-label'>
                    {t('settings.playSounds')}
                </h2>
                <Checkbox
                    isChecked = { soundsIncomingMessage }
                    label = { t('settings.incomingMessage') }
                    name = 'incoming-message'
                    onChange = { this._onIncomingMessageChange } />
                <Checkbox
                    isChecked = { soundsParticipantJoined }
                    label = { t('settings.participantJoined') }
                    name = 'participant-joined'
                    onChange = { this._onParticipantJoinedChange } />
                <Checkbox
                    isChecked = { soundsParticipantLeft }
                    label = { t('settings.participantLeft') }
                    name = 'participant-left'
                    onChange = { this._onParticipantLeftChange } />
                <Checkbox
                    isChecked = { soundsTalkWhileMuted }
                    label = { t('settings.talkWhileMuted') }
                    name = 'talk-while-muted'
                    onChange = { this._onTalkWhileMutedChange } />
            </div>
        );
    }
}

export default translate(SoundsTab);
