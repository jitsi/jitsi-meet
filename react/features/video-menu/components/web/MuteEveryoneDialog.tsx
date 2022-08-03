/* eslint-disable lines-around-comment */
import React from 'react';

// @ts-ignore
import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
import Switch from '../../../base/ui/components/web/Switch';
import AbstractMuteEveryoneDialog, { abstractMapStateToProps, type Props }
// @ts-ignore
    from '../AbstractMuteEveryoneDialog';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting all remote participants.
 *
 * @augments AbstractMuteEveryoneDialog
 */
class MuteEveryoneDialog extends AbstractMuteEveryoneDialog<Props> {

    /**
     * Toggles advanced moderation switch.
     *
     * @returns {void}
     */
    _onToggleModeration() {
        // @ts-ignore
        this.setState(state => {
            return {
                audioModerationEnabled: !state.audioModerationEnabled,
                // @ts-ignore
                content: this.props.t(state.audioModerationEnabled
                    ? 'dialog.muteEveryoneDialog' : 'dialog.muteEveryoneDialogModerationOn'
                )
            };
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okKey = 'dialog.muteParticipantButton'
                onSubmit = { this._onSubmit }
                // @ts-ignore
                titleString = { this.props.title }
                width = 'small'>
                <div className = 'mute-dialog'>
                    {/* @ts-ignore */}
                    { this.state.content }
                    {/* @ts-ignore */}
                    { this.props.isModerationSupported && this.props.exclude.length === 0 && (
                        <>
                            <div className = 'separator-line' />
                            <div className = 'control-row'>
                                <label htmlFor = 'moderation-switch'>
                                    {/* @ts-ignore */}
                                    {this.props.t('dialog.moderationAudioLabel')}
                                </label>
                                <Switch
                                    // @ts-ignore
                                    checked = { !this.state.audioModerationEnabled }
                                    id = 'moderation-switch'
                                    onChange = { this._onToggleModeration } />
                            </div>
                        </>
                    )}
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

// @ts-ignore
export default translate(connect(abstractMapStateToProps)(MuteEveryoneDialog));
