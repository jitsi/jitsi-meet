// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { Switch } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractMuteEveryonesVideoDialog, { abstractMapStateToProps, type Props, type State }
    from '../AbstractMuteEveryonesVideoDialog';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before disabling all remote participants cameras.
 *
 * @extends AbstractMuteEveryonesVideoDialog
 */
class MuteEveryonesVideoDialog extends AbstractMuteEveryonesVideoDialog<Props, State> {

    /**
     * Toggles advanced moderation switch.
     *
     * @returns {void}
     */
    _onToggleModeration() {
        this.setState(state => {
            return {
                enableModeration: !state.enableModeration,
                content: this.props.t(
                    `dialog.muteEveryonesVideoDialog${state.enableModeration
                        ? ''
                        : 'ModerationOn'}`
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
                    {this.props.exclude.length === 0 && this.props.showAdvancedModerationToggle && (
                        <>
                            <div className = 'separator-line' />
                            <div className = 'control-row'>
                                <label htmlFor = 'moderation-switch'>
                                    {this.props.t('dialog.moderationAudioLabel')}
                                </label>
                                <Switch
                                    id = 'moderation-switch'
                                    onValueChange = { this._onToggleModeration }
                                    value = { this.state.enableModeration } />
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
