// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { Switch } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractMuteEveryonesVideoDialog, { abstractMapStateToProps, type Props }
    from '../AbstractMuteEveryonesVideoDialog';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before disabling all remote participants cameras.
 *
 * @augments AbstractMuteEveryonesVideoDialog
 */
class MuteEveryonesVideoDialog extends AbstractMuteEveryonesVideoDialog<Props> {

    /**
     * Toggles advanced moderation switch.
     *
     * @returns {void}
     */
    _onToggleModeration() {
        this.setState(state => {
            return {
                moderationEnabled: !state.moderationEnabled,
                content: this.props.t(state.moderationEnabled
                    ? 'dialog.muteEveryonesVideoDialog' : 'dialog.muteEveryonesVideoDialogModerationOn'
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
                okKey = 'dialog.muteParticipantsVideoButton'
                onSubmit = { this._onSubmit }
                titleString = { this.props.title }
                width = 'small'>
                <div className = 'mute-dialog'>
                    {this.state.content}
                    { this.props.isModerationSupported && this.props.exclude.length === 0 && (
                        <>
                            <div className = 'separator-line' />
                            <div className = 'control-row'>
                                <label htmlFor = 'moderation-switch'>
                                    {this.props.t('dialog.moderationVideoLabel')}
                                </label>
                                <Switch
                                    id = 'moderation-switch'
                                    onValueChange = { this._onToggleModeration }
                                    value = { !this.state.moderationEnabled } />
                            </div>
                        </>
                    )}
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect(abstractMapStateToProps)(MuteEveryonesVideoDialog));
