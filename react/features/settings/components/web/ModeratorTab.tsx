import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';
import { WithTranslation } from 'react-i18next';

import AbstractDialogTab, {
    IProps as AbstractDialogTabProps } from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Checkbox from '../../../base/ui/components/web/Checkbox';

/**
 * The type of the React {@code Component} props of {@link ModeratorTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * CSS classes object.
     */
    classes: any;

    /**
     * If set hides the reactions moderation setting.
     */
    disableReactionsModeration: boolean;

    /**
     * Whether or not follow me is currently active (enabled by some other participant).
     */
    followMeActive: boolean;

    /**
     * Whether or not the user has selected the Follow Me feature to be enabled.
     */
    followMeEnabled: boolean;

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
}

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column' as const
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

        // Bind event handler so it is only bound once for every instance.
        this._onStartAudioMutedChanged = this._onStartAudioMutedChanged.bind(this);
        this._onStartVideoMutedChanged = this._onStartVideoMutedChanged.bind(this);
        this._onStartReactionsMutedChanged = this._onStartReactionsMutedChanged.bind(this);
        this._onFollowMeEnabledChanged = this._onFollowMeEnabledChanged.bind(this);
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
        super._onChange({ followMeEnabled: checked });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            classes,
            disableReactionsModeration,
            followMeActive,
            followMeEnabled,
            startAudioMuted,
            startVideoMuted,
            startReactionsMuted,
            t
        } = this.props;

        return (
            <div
                className = { `moderator-tab ${classes.container}` }
                key = 'moderator'>
                <h2 className = { classes.title }>
                    {t('settings.moderatorOptions')}
                </h2>
                <Checkbox
                    checked = { startAudioMuted }
                    className = { classes.checkbox }
                    label = { t('settings.startAudioMuted') }
                    name = 'start-audio-muted'
                    onChange = { this._onStartAudioMutedChanged } />
                <Checkbox
                    checked = { startVideoMuted }
                    className = { classes.checkbox }
                    label = { t('settings.startVideoMuted') }
                    name = 'start-video-muted'
                    onChange = { this._onStartVideoMutedChanged } />
                <Checkbox
                    checked = { followMeEnabled && !followMeActive }
                    className = { classes.checkbox }
                    disabled = { followMeActive }
                    label = { t('settings.followMe') }
                    name = 'follow-me'
                    onChange = { this._onFollowMeEnabledChanged } />
                { !disableReactionsModeration
                        && <Checkbox
                            checked = { startReactionsMuted }
                            className = { classes.checkbox }
                            label = { t('settings.startReactionsMuted') }
                            name = 'start-reactions-muted'
                            onChange = { this._onStartReactionsMutedChanged } /> }
            </div>
        );
    }
}

export default withStyles(styles)(translate(ModeratorTab));
