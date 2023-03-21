// @flow

import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { IconRaiseHand } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';
import AbstractRaisedHandIndicator, {
    type Props as AbstractProps,
    _mapStateToProps
} from '../AbstractRaisedHandIndicator';

import styles from './styles';


type Props = AbstractProps & {

    /**
     * Whether or not tile view layout has been enabled as the user preference.
     */
    isTileViewEnabled: boolean
};

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
        const { isTileViewEnabled } = this.props;
        const raisedHandIndicatorStyles = isTileViewEnabled
            ? styles.raisedHandIndicatorTileView
            : styles.raisedHandIndicator;

        return (
            <View style = { raisedHandIndicatorStyles }>
                <BaseIndicator
                    icon = { IconRaiseHand }
                    iconStyle = { styles.raisedHandIcon } />
            </View>
        );
    }
}

export default connect(_mapStateToProps)(RaisedHandIndicator);
