// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { Icon } from '../../../base/font-icons';

import styles from './styles';

type Props = {

    /**
     * True if a highlighted background has to be applied.
     */
    highlight: boolean,

    /**
     * The name of the icon to be used as the indicator.
     */
    icon: string
};

/**
 * Implements a base indicator to be reused across all native indicators on
 * the filmstrip.
 */
export default class BaseIndicator extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { highlight, icon } = this.props;

        const iconElement = (<Icon
            name = { icon }
            style = { styles.indicator } />
        );

        if (highlight) {
            return (
                <View style = { styles.indicatorBackground }>
                    { iconElement }
                </View>
            );
        }

        return iconElement;
    }
}
