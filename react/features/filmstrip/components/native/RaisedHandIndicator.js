/* @flow */

import React from 'react';
import { View } from 'react-native';

import { Icon } from '../../../base/font-icons';
import { connect } from '../../../base/redux';

import AbstractRaisedHandIndicator, {
    type Props,
    _mapStateToProps
} from '../AbstractRaisedHandIndicator';

import styles from './styles';

/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @extends Component
 */
class RaisedHandIndicator extends AbstractRaisedHandIndicator<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._raisedHand) {
            return null;
        }

        return (
            <View style = { styles.indicatorBackground }>
                <Icon
                    name = 'raised-hand'
                    style = { styles.indicator } />
            </View>
        );
    }
}

export default connect(_mapStateToProps)(RaisedHandIndicator);
