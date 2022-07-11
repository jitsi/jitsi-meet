import React from 'react';
import Dialog from 'react-native-dialog';
import { Divider } from 'react-native-paper';

import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractMuteEveryonesVideoDialog, {
    abstractMapStateToProps as _mapStateToProps,
    type Props } from '../AbstractMuteEveryonesVideoDialog';

import styles from './styles';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting all remote participants.
 *
 * @augments AbstractMuteEveryonesVideoDialog
 */
class MuteEveryonesVideoDialog extends AbstractMuteEveryonesVideoDialog<Props> {

    /**
     * Renders the dialog switch.
     *
     * @returns {React$Component}
     */
    _renderSwitch() {
        return (
            this.props.exclude.length === 0
            && <Dialog.Switch
                label = { this.props.t('dialog.moderationVideoLabel') }
                onValueChange = { this._onToggleModeration }
                value = { !this.state.moderationEnabled } />
        );
    }

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
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <ConfirmDialog
                confirmLabel = 'dialog.muteEveryonesVideoDialogOk'
                descriptionKey = { this.state.content }
                onSubmit = { this._onSubmit }
                title = { this.props.title }>
                <Divider style = { styles.dividerDialog } />
                { this._renderSwitch() }
            </ConfirmDialog>
        );
    }
}

export default translate(connect(_mapStateToProps)(MuteEveryonesVideoDialog));
