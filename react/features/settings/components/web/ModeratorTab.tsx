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
 * The type of the React {@code Component} props of {@link ModeratorTab}.
 */
export type Props = AbstractDialogTabProps & WithTranslation & {

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

    /**
     * Invoked to obtain translated strings.
     */
    t: Function;
};

/**
 * React {@code Component} for modifying language and moderator settings.
 *
 * @augments Component
 */
class ModeratorTab extends AbstractDialogTab<Props> {
    /**
     * Initializes a new {@code ModeratorTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onStartAudioMutedChanged = this._onStartAudioMutedChanged.bind(this);
        this._onStartVideoMutedChanged = this._onStartVideoMutedChanged.bind(this);
        this._onStartReactionsMutedChanged = this._onStartReactionsMutedChanged.bind(this);
        this._onFollowMeEnabledChanged = this._onFollowMeEnabledChanged.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return <div className = 'moderator-tab box'>{ this._renderModeratorSettings() }</div>;
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
     * Returns the React Element for modifying conference-wide settings.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderModeratorSettings() {
        const {
            disableReactionsModeration,
            followMeActive,
            followMeEnabled,
            startAudioMuted,
            startVideoMuted,
            startReactionsMuted,
            t // @ts-ignore
        } = this.props;

        return (
            <div
                className = 'settings-sub-pane-element'
                key = 'moderator'>
                <div className = 'moderator-settings-wrapper'>
                    <Checkbox
                        checked = { startAudioMuted }
                        className = 'settings-checkbox'
                        label = { t('settings.startAudioMuted') }
                        name = 'start-audio-muted'
                        onChange = { this._onStartAudioMutedChanged } />
                    <Checkbox
                        checked = { startVideoMuted }
                        className = 'settings-checkbox'
                        label = { t('settings.startVideoMuted') }
                        name = 'start-video-muted'
                        onChange = { this._onStartVideoMutedChanged } />
                    <Checkbox
                        checked = { followMeEnabled && !followMeActive }
                        className = 'settings-checkbox'
                        disabled = { followMeActive }
                        label = { t('settings.followMe') }
                        name = 'follow-me'
                        onChange = { this._onFollowMeEnabledChanged } />
                    { !disableReactionsModeration
                        && <Checkbox
                            checked = { startReactionsMuted }
                            className = 'settings-checkbox'
                            label = { t('settings.startReactionsMuted') }
                            name = 'start-reactions-muted'
                            onChange = { this._onStartReactionsMutedChanged } /> }
                </div>
            </div>
        );
    }
}

// @ts-ignore
export default translate(ModeratorTab);
