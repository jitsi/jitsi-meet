// @flow

import React from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import styles from '../styles';

import AbstractStopLiveStreamDialog, {
    _mapStateToProps
} from './AbstractStopLiveStreamDialog';

/**
 * A React Component for confirming the participant wishes to stop the currently
 * active live stream of the conference.
 *
 * @extends Component
 */
class StopLiveStreamDialog extends AbstractStopLiveStreamDialog {

    /**
     * Renders the platform specific {@code Dialog} content.
     *
     * @inheritdoc
     */
    _renderDialogContent() {
        return (
            <View style = { styles.messageContainer }>
                <Text>
                    {
                        this.props.t('dialog.stopStreamingWarning')
                    }
                </Text>
            </View>
        );
    }
}

export default translate(connect(_mapStateToProps)(StopLiveStreamDialog));
