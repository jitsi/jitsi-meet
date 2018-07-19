// @flow

import React from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import styles from '../styles';

import AbstractStopRecordingDialog, {
    type Props,
    _mapStateToProps
} from './AbstractStopRecordingDialog';

/**
 * React Component for getting confirmation to stop a file recording session in
 * progress.
 *
 * @extends Component
 */
class StopRecordingDialog extends AbstractStopRecordingDialog<Props> {

    /**
     * Renders the platform specific dialog content.
     *
     * @inheritdoc
     */
    _renderDialogContent() {
        const { t } = this.props;

        return (
            <View style = { styles.messageContainer }>
                <Text>
                    { t('dialog.stopRecordingWarning') }
                </Text>
            </View>
        );
    }
}

export default translate(connect(_mapStateToProps)(StopRecordingDialog));
