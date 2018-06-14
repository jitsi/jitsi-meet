// @flow

import React from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import styles from '../styles';

import AbstractStartRecordingDialog, {
    type Props,
    _mapStateToProps
} from './AbstractStartRecordingDialog';

/**
 * React Component for getting confirmation to start a file recording session.
 *
 * @extends Component
 */
class StartRecordingDialog extends AbstractStartRecordingDialog<Props> {
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
                    { t('recording.startRecordingBody') }
                </Text>
            </View>
        );
    }
}

export default translate(connect(_mapStateToProps)(StartRecordingDialog));
