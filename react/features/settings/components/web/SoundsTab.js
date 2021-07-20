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
 * React {@code Component} for modifying the local user's sound settings.
 *
 * @extends Component
 */
class SoundsTab extends AbstractDialogTab<Props> {
    /**
     * Initializes a new {@code SoundsTab} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code SoundsTab} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onChange = this._onChange.bind(this);
    }

    _onChange: (Object) => void;

    /**
     * Changes a sound setting state.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onChange({ target }) {
        super._onChange({ [target.name]: target.checked });
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
                    name = 'soundsIncomingMessage'
                    onChange = { this._onChange } />
                <Checkbox
                    isChecked = { soundsParticipantJoined }
                    label = { t('settings.participantJoined') }
                    name = 'soundsParticipantJoined'
                    onChange = { this._onChange } />
                <Checkbox
                    isChecked = { soundsParticipantLeft }
                    label = { t('settings.participantLeft') }
                    name = 'soundsParticipantLeft'
                    onChange = { this._onChange } />
                <Checkbox
                    isChecked = { soundsTalkWhileMuted }
                    label = { t('settings.talkWhileMuted') }
                    name = 'soundsTalkWhileMuted'
                    onChange = { this._onChange } />
            </div>
        );
    }
}

export default translate(SoundsTab);
