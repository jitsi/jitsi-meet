import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import Switch from '../../../base/ui/components/web/Switch';
import AbstractMuteEveryonesDesktopDialog, { type IProps, abstractMapStateToProps }
    from '../AbstractMuteEveryonesDesktopDialog';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before disabling all remote participants cameras.
 *
 * @augments AbstractMuteEveryonesDesktopDialog
 */
class MuteEveryonesDesktopDialog extends AbstractMuteEveryonesDesktopDialog<IProps> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        return (
            <Dialog
                ok = {{ translationKey: 'dialog.muteParticipantsDesktopButton' }}
                onSubmit = { this._onSubmit }
                title = { this.props.title }>
                <div className = 'mute-dialog'>
                    {this.state.content}
                    { this.props.isModerationSupported && this.props.exclude.length === 0 && (
                        <>
                            <div className = 'separator-line' />
                            <div className = 'control-row'>
                                <label htmlFor = 'moderation-switch'>
                                    {this.props.t('dialog.moderationDesktopLabel')}
                                </label>
                                <Switch
                                    checked = { !this.state.moderationEnabled }
                                    id = 'moderation-switch'
                                    onChange = { this._onToggleModeration } />
                            </div>
                        </>
                    )}
                </div>
            </Dialog>
        );
    }
}

export default translate(connect(abstractMapStateToProps)(MuteEveryonesDesktopDialog));
