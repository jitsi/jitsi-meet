import { Theme } from '@mui/material';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import AbstractDialogTab, {
    IProps as AbstractDialogTabProps } from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import { setMuteSoundGlobal } from '../../../base/sounds/functions.web';
import { ISoundsState } from '../../../base/sounds/reducer';
import Checkbox from '../../../base/ui/components/web/Checkbox';

/**
 * The type of the React {@code Component} props of {@link ModeratorTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {
    /**
     * Whether the user has selected the audio moderation feature to be enabled.
     */
    audioModerationEnabled: boolean;

    /**
     * Whether the user has selected the chat with permissions feature to be enabled.
     */
    chatWithPermissionsEnabled: boolean;

    /**
     * CSS classes object.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * Whether to hide chat with permissions.
     */
    disableChatWithPermissions: boolean;

    /**
     * If set hides the reactions moderation setting.
     */
    disableReactionsModeration: boolean;

    /**
     * Invoked to save changed settings.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether or not follow me is currently active (enabled by some other participant).
     */
    followMeActive: boolean;

    /**
     * Whether or not the user has selected the Follow Me feature to be enabled.
     */
    followMeEnabled: boolean;

    /**
     * Whether follow me for recorder is currently active (enabled by some other participant).
     */
    followMeRecorderActive: boolean;

    /**
     * Whether the user has selected the Follow Me Recorder feature to be enabled.
     */
    followMeRecorderEnabled: boolean;

    /**
     * The sounds from the Redux store.
     */
    sounds: ISoundsState;

    /**
     * Whether or not the user has selected the Start Audio Muted feature to be
     * enabled.
     */
    startAudioMuted: boolean;

    /**
     * Whether or not the user has selected the Start Reactions Muted feature to be
     * enabled.
     */
    startReactionsMuted: boolean;

    /**
     * Whether or not the user has selected the Start Video Muted feature to be
     * enabled.
     */
    startVideoMuted: boolean;

    /**
     * The Redux State.
     */
    state: IReduxState;

    /**
     * Whether the user has selected the video moderation feature to be enabled.
     */
    videoModerationEnabled: boolean;
}

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column' as const
        },

        title: {
            ...theme.typography.heading6,
            color: `${theme.palette.text01} !important`,
            marginBottom: theme.spacing(3)
        },

        checkbox: {
            marginBottom: theme.spacing(3)
        }
    };
};

/**
 * React {@code Component} for modifying language and moderator settings.
 *
 * @augments Component
 */
class ModeratorTab extends AbstractDialogTab<IProps, any> {
    /**
     * Initializes a new {@code ModeratorTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {};

        // Bind event handler so it is only bound once for every instance.
        this._onMuteSoundForEveryone = this._onMuteSoundForEveryone.bind(this);
        this._onStartAudioMutedChanged = this._onStartAudioMutedChanged.bind(this);
        this._onStartVideoMutedChanged = this._onStartVideoMutedChanged.bind(this);
        this._onStartReactionsMutedChanged = this._onStartReactionsMutedChanged.bind(this);
        this._onFollowMeEnabledChanged = this._onFollowMeEnabledChanged.bind(this);
        this._onFollowMeRecorderEnabledChanged = this._onFollowMeRecorderEnabledChanged.bind(this);
        this._onChatWithPermissionsChanged = this._onChatWithPermissionsChanged.bind(this);
    }

    /**
     * Mutes/unmutes a sound for everyone in the conference.
     *
     * @param {string} soundId - The ID of the sound to mute/unmute.
     * @param {Object} e - The change event from the checkbox.
     * @returns {void}
     */
    _onMuteSoundForEveryone(soundId: string, { target: { checked } }: { target: { checked: boolean; }; }) {
        this.setState({ [soundId]: checked });
        setMuteSoundGlobal(soundId, checked, true, this.props.state);
    }


    /**
     * Callback invoked to select if conferences should start
     * with audio muted.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartAudioMutedChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ startAudioMuted: checked });
    }

    /**
     * Callback invoked to select if conferences should start
     * with video disabled.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartVideoMutedChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ startVideoMuted: checked });
    }

    /**
     * Callback invoked to select if conferences should start
     * with reactions muted.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartReactionsMutedChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ startReactionsMuted: checked });
    }

    /**
     * Callback invoked to select if follow-me mode
     * should be activated.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onFollowMeEnabledChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({
            followMeEnabled: checked,
            followMeRecorderEnabled: checked ? false : undefined
        });
    }

    /**
     * Callback invoked to select if follow-me for recorder mode should be activated.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onFollowMeRecorderEnabledChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({
            followMeEnabled: checked ? false : undefined,
            followMeRecorderEnabled: checked
        });
    }

    /**
     * Callback invoked to select if chat with permissions should be activated.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onChatWithPermissionsChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ chatWithPermissionsEnabled: checked });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const {
            audioModerationEnabled,
            chatWithPermissionsEnabled,
            disableChatWithPermissions,
            disableReactionsModeration,
            followMeActive,
            followMeEnabled,
            followMeRecorderActive,
            followMeRecorderEnabled,
            startAudioMuted,
            startVideoMuted,
            startReactionsMuted,
            sounds,
            t,
            videoModerationEnabled
        } = this.props;
        const classes = withStyles.getClasses(this.props);

        const followMeRecorderChecked = followMeRecorderEnabled && !followMeRecorderActive;

        return (
            <div
                className = { `moderator-tab ${classes.container}` }
                key = 'moderator'>
                <h2 className = { classes.title }>
                    {t('settings.moderatorOptions')}
                </h2>
                { !audioModerationEnabled && <Checkbox
                    checked = { startAudioMuted }
                    className = { classes.checkbox }
                    label = { t('settings.startAudioMuted') }
                    name = 'start-audio-muted'
                    onChange = { this._onStartAudioMutedChanged } /> }
                { !videoModerationEnabled && <Checkbox
                    checked = { startVideoMuted }
                    className = { classes.checkbox }
                    label = { t('settings.startVideoMuted') }
                    name = 'start-video-muted'
                    onChange = { this._onStartVideoMutedChanged } /> }
                <Checkbox
                    checked = { followMeEnabled && !followMeActive && !followMeRecorderChecked }
                    className = { classes.checkbox }
                    disabled = { followMeActive || followMeRecorderActive }
                    label = { t('settings.followMe') }
                    name = 'follow-me'
                    onChange = { this._onFollowMeEnabledChanged } />
                <Checkbox
                    checked = { followMeRecorderChecked }
                    className = { classes.checkbox }
                    disabled = { followMeRecorderActive || followMeActive }
                    label = { t('settings.followMeRecorder') }
                    name = 'follow-me-recorder'
                    onChange = { this._onFollowMeRecorderEnabledChanged } />
                { (!disableReactionsModeration || Boolean(sounds.size))
                    && <h4 className = { classes.title }>
                        Mute sound for everybody on
                    </h4>
                }
                { !disableReactionsModeration
                        && <Checkbox
                            checked = { startReactionsMuted }
                            className = { classes.checkbox }
                            label = { t('settings.startReactionsMuted') }
                            name = 'start-reactions-muted'
                            onChange = { this._onStartReactionsMutedChanged } /> }
                { Array.from(sounds.entries()).map(([ soundId, { options } ]) => {
                    if (!options?.optional) {
                        return null;
                    }
                    const localValue = this.state[soundId];
                    const reduxValue = this.props.sounds.get(soundId)?.isMuted ?? false;
                    const isMuted = typeof localValue === 'boolean' ? localValue : reduxValue;

                    return (
                        <Checkbox
                            checked = { isMuted }
                            className = { classes.checkbox }
                            disabled = { false }
                            key = { soundId }
                            label = { t(`settings.${soundId}`) }
                            name = { soundId }
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onChange = { e => this._onMuteSoundForEveryone(soundId, e) } />
                    );
                })}
                { !disableChatWithPermissions
                    && <Checkbox
                        checked = { chatWithPermissionsEnabled }
                        className = { classes.checkbox }
                        label = { t('settings.chatWithPermissions') }
                        name = 'chat-with-permissions'
                        onChange = { this._onChatWithPermissionsChanged } /> }
            </div>
        );
    }
}

const mapStateToProps = (state: any) => ({
    state,
    sounds: state['features/base/sounds']
});

export default connect(mapStateToProps)(withStyles(translate(ModeratorTab), styles));
