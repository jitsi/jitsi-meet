// @flow

import React from 'react';
import { View } from 'react-native';

import { IconRaisedHand } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractRaisedHandIndicator, {
    type Props,
    _mapStateToProps
} from '../AbstractRaisedHandIndicator';

import styles from './styles';

/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @augments Component
 */
class RaisedHandIndicator extends AbstractRaisedHandIndicator<Props> {
    /**
     * Renders the platform specific indicator element.
     *
     * @returns {React$Element<*>}
     */
    _renderIndicator() {
        return (
            <View style = { styles.raisedHandIndicator }>
                <BaseIndicator
                    icon = { IconRaisedHand }
                    iconStyle = { styles.raisedHandIcon } />
            </View>
        );
    }
}

export default connect(_mapStateToProps)(RaisedHandIndicator);
