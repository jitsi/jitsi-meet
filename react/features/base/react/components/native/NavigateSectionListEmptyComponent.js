// @flow

import React, { Component } from 'react';
import {
    Text,
    View
} from 'react-native';

import { Icon } from '../../../font-icons/index';
import { translate } from '../../../i18n/index';

import styles from './styles';

type Props = {

    /**
     * The translate function.
     */
    t: Function,
};

/**
 * Implements a React Native {@link Component} that is to be displayed when the
 * list is empty
 *
 * @extends Component
 */
class NavigateSectionListEmptyComponent extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <View style = { styles.pullToRefresh }>
                <Text style = { styles.pullToRefreshText }>
                    { t('sectionList.pullToRefresh') }
                </Text>
                <Icon
                    name = 'menu-down'
                    style = { styles.pullToRefreshIcon } />
            </View>
        );
    }
}

export default translate(NavigateSectionListEmptyComponent);
