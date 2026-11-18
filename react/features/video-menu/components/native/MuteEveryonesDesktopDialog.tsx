import React from 'react';
import { ViewStyle } from 'react-native';
import Dialog from 'react-native-dialog';
import { Divider } from 'react-native-paper';
import { connect } from 'react-redux';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { translate } from '../../../base/i18n/functions';
import AbstractMuteEveryonesDesktopDialog, {
    type IProps,
    abstractMapStateToProps as _mapStateToProps } from '../AbstractMuteEveryonesDesktopDialog';

import styles from './styles';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before stopping the screen share of all remote participants.
 *
 * @augments AbstractMuteEveryonesDesktopDialog
 */
class MuteEveryonesDesktopDialog extends AbstractMuteEveryonesDesktopDialog<IProps> {

    /**
     * Renders the dialog switch.
     *
     * @returns {React$Component}
     */
    _renderSwitch() {
        const moderationDesktopLabel = this.props.t('dialog.moderationDesktopLabel');

        return (
            this.props.isModerationSupported
            && this.props.exclude.length === 0
            && <Dialog.Switch
                accessibilityLabel = { moderationDesktopLabel }
                label = { moderationDesktopLabel }
                onValueChange = { this._onToggleModeration }
                value = { !this.state.moderationEnabled } />
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
                confirmLabel = 'dialog.muteParticipantsDesktopButton'
                descriptionKey = { this.state.content }
                onSubmit = { this._onSubmit }
                title = { this.props.title }>
                {/* @ts-ignore */}
                <Divider style = { styles.dividerDialog as ViewStyle } />
                { this._renderSwitch() }
            </ConfirmDialog>
        );
    }
}

export default translate(connect(_mapStateToProps)(MuteEveryonesDesktopDialog));
