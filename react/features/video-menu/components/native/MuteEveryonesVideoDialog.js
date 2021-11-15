// @flow

import React from 'react';
import { Switch, Text, View } from 'react-native';
import { Divider } from 'react-native-paper';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import AbstractMuteEveryonesVideoDialog, {
    abstractMapStateToProps,
    type Props as AbstractProps } from '../AbstractMuteEveryonesVideoDialog';

import styles from './styles';

type Props = AbstractProps & {

    /**
     * The color-schemed stylesheet of the base/dialog feature.
     */
    _dialogStyles: StyleType
}

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting all remote participants.
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
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <ConfirmDialog
                okKey = 'dialog.muteEveryonesVideoDialogOk'
                onSubmit = { this._onSubmit } >
                <Text style = { this.props._dialogStyles.text }>
                    { `${this.props.title} \n\n ${this.state.content}` }
                </Text>
                {this.props.exclude.length === 0 && <>
                    <Divider style = { styles.dividerWithSpacing } />
                    <View style = { styles.toggleContainer }>
                        <Text
                            style = {{ ...this.props._dialogStyles.text,
                                ...styles.toggleLabel }}>
                            {this.props.t('dialog.moderationVideoLabel')}
                        </Text>
                        <Switch
                            onValueChange = { this._onToggleModeration }
                            value = { !this.state.moderationEnabled } />
                    </View>
                </>}
            </ConfirmDialog>
        );
    }

    _onSubmit: () => boolean;
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {{
    *     _dialogStyles: StyleType
    * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    return {
        ...abstractMapStateToProps(state, ownProps),
        _dialogStyles: ColorSchemeRegistry.get(state, 'Dialog')
    };
}

export default translate(connect(_mapStateToProps)(MuteEveryonesVideoDialog));
