import React from 'react';
import { View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IconRaiseHand } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';
import AbstractRaisedHandIndicator, {
    IProps,
    _mapStateToProps
} from '../AbstractRaisedHandIndicator';

import styles from './styles';


/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @augments Component
 */
class RaisedHandIndicator extends AbstractRaisedHandIndicator<IProps> {
    /**
     * Renders the platform specific indicator element.
     *
     * @returns {React$Element<*>}
     */
    _renderIndicator() {
        return (
            <View style = { styles.raisedHandIndicator as ViewStyle }>
                <BaseIndicator
                    icon = { IconRaiseHand }
                    iconStyle = { styles.raisedHandIcon } />
            </View>
        );
    }
}

export default connect(_mapStateToProps)(RaisedHandIndicator);
