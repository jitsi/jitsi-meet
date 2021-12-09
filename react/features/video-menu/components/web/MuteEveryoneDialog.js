// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { Switch } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractMuteEveryoneDialog, { abstractMapStateToProps, type Props }
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
        this.setState(state => {
            return {
                audioModerationEnabled: !state.audioModerationEnabled,
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
                titleString = { this.props.title }
                width = 'small'>
                <div className = 'mute-dialog'>
                    { this.state.content }
                    { this.props.isModerationSupported && this.props.exclude.length === 0 && (
                        <>
                            <div className = 'separator-line' />
                            <div className = 'control-row'>
                                <label htmlFor = 'moderation-switch'>
                                    {this.props.t('dialog.moderationAudioLabel')}
                                </label>
                                <Switch
                                    id = 'moderation-switch'
                                    onValueChange = { this._onToggleModeration }
                                    value = { !this.state.audioModerationEnabled } />
                            </div>
                        </>
                    )}
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect(abstractMapStateToProps)(MuteEveryoneDialog));
