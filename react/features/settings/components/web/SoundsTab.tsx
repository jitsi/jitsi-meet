import React from 'react';
import { WithTranslation } from 'react-i18next';

// @ts-ignore
import { AbstractDialogTab } from '../../../base/dialog';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import type { Props as AbstractDialogTabProps } from '../../../base/dialog';
import { translate } from '../../../base/i18n/functions';
import Checkbox from '../../../base/ui/components/web/Checkbox';

/**
 * The type of the React {@code Component} props of {@link SoundsTab}.
 */
export type Props = AbstractDialogTabProps & WithTranslation & {

    /**
     * Whether or not the reactions feature is enabled.
     */
    enableReactions: Boolean;

    /**
     * Whether or not moderator muted the sounds.
     */
    moderatorMutedSoundsReactions: Boolean;

    /**
     * Whether or not the sound for the incoming message should play.
     */
    soundsIncomingMessage: Boolean;

    /**
     * Whether or not the sound for the participant joined should play.
     */
    soundsParticipantJoined: Boolean;

    /**
     * Whether or not the sound for the participant entering the lobby should play.
     */
    soundsParticipantKnocking: Boolean;

    /**
     * Whether or not the sound for the participant left should play.
     */
    soundsParticipantLeft: Boolean;

    /**
    * Whether or not the sound for reactions should play.
    */
    soundsReactions: Boolean;

    /**
     * Whether or not the sound for the talk while muted notification should play.
     */
    soundsTalkWhileMuted: Boolean;

    /**
     * Invoked to obtain translated strings.
     */
    t: Function;
};

/**
 * React {@code Component} for modifying the local user's sound settings.
 *
 * @augments Component
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

    /**
     * Changes a sound setting state.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onChange({ target }: React.ChangeEvent<HTMLInputElement>) {
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
            soundsParticipantKnocking,
            soundsParticipantLeft,
            soundsTalkWhileMuted,
            soundsReactions,
            enableReactions,
            moderatorMutedSoundsReactions,
            t // @ts-ignore
        } = this.props;

        return (
            <div
                className = 'settings-sub-pane-element'
                key = 'sounds'>
                <h2 className = 'mock-atlaskit-label'>
                    {t('settings.playSounds')}
                </h2>
                {enableReactions && <Checkbox
                    checked = { soundsReactions }
                    className = 'settings-checkbox'
                    disabled = { moderatorMutedSoundsReactions }
                    label = { t('settings.reactions') }
                    name = 'soundsReactions'
                    onChange = { this._onChange } />
                }
                <Checkbox
                    checked = { soundsIncomingMessage }
                    className = 'settings-checkbox'
                    label = { t('settings.incomingMessage') }
                    name = 'soundsIncomingMessage'
                    onChange = { this._onChange } />
                <Checkbox
                    checked = { soundsParticipantJoined }
                    className = 'settings-checkbox'
                    label = { t('settings.participantJoined') }
                    name = 'soundsParticipantJoined'
                    onChange = { this._onChange } />
                <Checkbox
                    checked = { soundsParticipantLeft }
                    className = 'settings-checkbox'
                    label = { t('settings.participantLeft') }
                    name = 'soundsParticipantLeft'
                    onChange = { this._onChange } />
                <Checkbox
                    checked = { soundsTalkWhileMuted }
                    className = 'settings-checkbox'
                    label = { t('settings.talkWhileMuted') }
                    name = 'soundsTalkWhileMuted'
                    onChange = { this._onChange } />
                <Checkbox
                    checked = { soundsParticipantKnocking }
                    className = 'settings-checkbox'
                    label = { t('settings.participantKnocking') }
                    name = 'soundsParticipantKnocking'
                    onChange = { this._onChange } />
            </div>
        );
    }
}

// @ts-ignore
export default translate(SoundsTab);
