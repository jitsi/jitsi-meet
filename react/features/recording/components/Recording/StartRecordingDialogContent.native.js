// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { translate } from '../../../base/i18n';

import styles from '../styles';

type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React Component for getting confirmation to start a file recording session.
 *
 * @extends Component
 */
class StartRecordingDialogContent extends Component<Props> {
    /**
     * Renders the platform specific dialog content.
     *
     * @returns {void}
     */
    render() {
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

export default translate(StartRecordingDialogContent);
