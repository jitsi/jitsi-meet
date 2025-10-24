import React from 'react';
import { ViewStyle } from 'react-native';
import Dialog from 'react-native-dialog';
import { Divider } from 'react-native-paper';
import { connect } from 'react-redux';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { translate } from '../../../base/i18n/functions';
import AbstractMuteEveryoneDialog, {
    type IProps,
    abstractMapStateToProps as _mapStateToProps } from '../AbstractMuteEveryoneDialog';

import styles from './styles';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting all remote participants.
 *
 * @augments AbstractMuteEveryoneDialog
 */
class MuteEveryoneDialog extends AbstractMuteEveryoneDialog<IProps> {

    /**
     * Renders the dialog switch.
     *
     * @returns {React$Component}
     */
    _renderSwitch() {
        return (
            this.props.exclude.length === 0
            && <Dialog.Switch
                label = { this.props.t('dialog.moderationAudioLabel') }
                onValueChange = { this._onToggleModeration }
                value = { !this.state.audioModerationEnabled } />
        );
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        return (
            <ConfirmDialog
                confirmLabel = 'dialog.muteParticipantButton'
                descriptionKey = { this.state.content }
                onSubmit = { this._onSubmit }
                title = { this.props.title } >
                {/* @ts-ignore */}
                <Divider style = { styles.dividerDialog as ViewStyle } />
                { this._renderSwitch() }
            </ConfirmDialog>
        );
    }
}

export default translate(connect(_mapStateToProps)(MuteEveryoneDialog));
