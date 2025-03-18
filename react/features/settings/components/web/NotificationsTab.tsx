import { Theme } from '@mui/material';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { withStyles } from 'tss-react/mui';

import AbstractDialogTab, {
    IProps as AbstractDialogTabProps } from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Checkbox from '../../../base/ui/components/web/Checkbox';

/**
 * The type of the React {@code Component} props of {@link NotificationsTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * CSS classes object.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * Array of disabled sounds ids.
     */
    disabledSounds: string[];

    /**
     * Whether or not the reactions feature is enabled.
     */
    enableReactions: Boolean;

    /**
     * The types of enabled notifications that can be configured and their specific visibility.
     */
    enabledNotifications: Object;

    /**
     * Whether or not moderator muted the sounds.
     */
    moderatorMutedSoundsReactions: Boolean;

    /**
     * Whether or not to display notifications settings.
     */
    showNotificationsSettings: boolean;

    /**
     * Whether sound settings should be displayed or not.
     */
    showSoundsSettings: boolean;

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
}

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            width: '100%',

            '@media (max-width: 607px)': {
                flexDirection: 'column' as const
            }
        },

        column: {
            display: 'flex',
            flexDirection: 'column' as const,
            flex: 1,

            '&:first-child:not(:last-child)': {
                marginRight: theme.spacing(3),

                '@media (max-width: 607px)': {
                    marginRight: 0,
                    marginBottom: theme.spacing(3)
                }
            }
        },

        title: {
            ...withPixelLineHeight(theme.typography.heading6),
            color: `${theme.palette.text01} !important`,
            marginBottom: theme.spacing(3)
        },

        checkbox: {
            marginBottom: theme.spacing(3)
        }
    };
};

/**
 * React {@code Component} for modifying the local user's sound settings.
 *
 * @augments Component
 */
class NotificationsTab extends AbstractDialogTab<IProps, any> {
    /**
     * Initializes a new {@code SoundsTab} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code SoundsTab} instance with.
     */
    constructor(props: IProps) {
        super(props);

        this._onEnabledNotificationsChanged = this._onEnabledNotificationsChanged.bind(this);
    }

    /**
     * Changes a sound setting state.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    override _onChange({ target }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ [target.name]: target.checked });
    }

    /**
     * Callback invoked to select if the given type of
     * notifications should be shown.
     *
     * @param {Object} e - The key event to handle.
     * @param {string} type - The type of the notification.
     *
     * @returns {void}
     */
    _onEnabledNotificationsChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>, type: any) {
        super._onChange({
            enabledNotifications: {
                ...this.props.enabledNotifications,
                [type]: checked
            }
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const {
            disabledSounds,
            enabledNotifications,
            showNotificationsSettings,
            showSoundsSettings,
            soundsIncomingMessage,
            soundsParticipantJoined,
            soundsParticipantKnocking,
            soundsParticipantLeft,
            soundsTalkWhileMuted,
            soundsReactions,
            enableReactions,
            moderatorMutedSoundsReactions,
            t
        } = this.props;
        const classes = withStyles.getClasses(this.props);

        return (
            <form
                className = { classes.container }
                key = 'sounds'>
                {showSoundsSettings && (
                    <fieldset className = { classes.column }>
                        <legend className = { classes.title }>
                            {t('settings.playSounds')}
                        </legend>
                        {enableReactions && <Checkbox
                            checked = { soundsReactions && !disabledSounds.includes('REACTION_SOUND') }
                            className = { classes.checkbox }
                            disabled = { Boolean(moderatorMutedSoundsReactions
                                || disabledSounds.includes('REACTION_SOUND')) }
                            label = { t('settings.reactions') }
                            name = 'soundsReactions'
                            onChange = { this._onChange } />
                        }
                        <Checkbox
                            checked = { soundsIncomingMessage && !disabledSounds.includes('INCOMING_MSG_SOUND') }
                            className = { classes.checkbox }
                            disabled = { disabledSounds.includes('INCOMING_MSG_SOUND') }
                            label = { t('settings.incomingMessage') }
                            name = 'soundsIncomingMessage'
                            onChange = { this._onChange } />
                        <Checkbox
                            checked = { soundsParticipantJoined
                                && !disabledSounds.includes('PARTICIPANT_JOINED_SOUND') }
                            className = { classes.checkbox }
                            disabled = { disabledSounds.includes('PARTICIPANT_JOINED_SOUND') }
                            label = { t('settings.participantJoined') }
                            name = 'soundsParticipantJoined'
                            onChange = { this._onChange } />
                        <Checkbox
                            checked = { soundsParticipantLeft && !disabledSounds.includes('PARTICIPANT_LEFT_SOUND') }
                            className = { classes.checkbox }
                            disabled = { disabledSounds.includes('PARTICIPANT_LEFT_SOUND') }
                            label = { t('settings.participantLeft') }
                            name = 'soundsParticipantLeft'
                            onChange = { this._onChange } />
                        <Checkbox
                            checked = { soundsTalkWhileMuted && !disabledSounds.includes('TALK_WHILE_MUTED_SOUND') }
                            className = { classes.checkbox }
                            disabled = { disabledSounds.includes('TALK_WHILE_MUTED_SOUND') }
                            label = { t('settings.talkWhileMuted') }
                            name = 'soundsTalkWhileMuted'
                            onChange = { this._onChange } />
                        <Checkbox
                            checked = { soundsParticipantKnocking
                                && !disabledSounds.includes('KNOCKING_PARTICIPANT_SOUND') }
                            className = { classes.checkbox }
                            disabled = { disabledSounds.includes('KNOCKING_PARTICIPANT_SOUND') }
                            label = { t('settings.participantKnocking') }
                            name = 'soundsParticipantKnocking'
                            onChange = { this._onChange } />
                    </fieldset>
                )}
                {showNotificationsSettings && (
                    <fieldset className = { classes.column }>
                        <legend className = { classes.title }>
                            {t('notify.displayNotifications')}
                        </legend>
                        {
                            Object.keys(enabledNotifications).map(key => (
                                <Checkbox
                                    checked = { Boolean(enabledNotifications[key as
                                        keyof typeof enabledNotifications]) }
                                    className = { classes.checkbox }
                                    key = { key }
                                    label = { t(key) }
                                    name = { `show-${key}` }
                                    /* eslint-disable-next-line react/jsx-no-bind */
                                    onChange = { e => this._onEnabledNotificationsChanged(e, key) } />
                            ))
                        }
                    </fieldset>
                )}
            </form>
        );
    }
}

export default withStyles(translate(NotificationsTab), styles);
