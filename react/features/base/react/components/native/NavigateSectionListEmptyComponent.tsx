import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { Text, View, ViewStyle } from 'react-native';

import { translate } from '../../../i18n/functions';
import Icon from '../../../icons/components/Icon';
import { IconArrowDown } from '../../../icons/svg';

import styles from './styles';

/**
 * Implements a React Native {@link Component} that is to be displayed when the
 * list is empty.
 *
 * @augments Component
 */
class NavigateSectionListEmptyComponent extends Component<WithTranslation> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { t } = this.props;

        return (
            <View style = { styles.pullToRefresh as ViewStyle }>
                <Text style = { styles.pullToRefreshText }>
                    { t('sectionList.pullToRefresh') }
                </Text>
                <Icon
                    src = { IconArrowDown }
                    style = { styles.pullToRefreshIcon } />
            </View>
        );
    }
}

export default translate(NavigateSectionListEmptyComponent);
