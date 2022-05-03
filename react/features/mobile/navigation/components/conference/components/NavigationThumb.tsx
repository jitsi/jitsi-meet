// @flow

import React from 'react';
import { SafeAreaView } from 'react-native';

import { Icon, IconCircle } from '../../../../../base/icons';

import styles, { ICON_ACTIVE_COLOR, ICON_INACTIVE_COLOR } from './styles';

export const enum THUMBS {
    CONFERENCE_VIEW  = 'CONFERENCE_VIEW ',
    CAR_VIEW = 'CAR_VIEW'
}

type Props = {

    /**
     * Which thumb is selected.
     */
    selectedThumb: THUMBS

}

/**
 * Bottom tab navigation screen indicator.
 *
 * @returns {JSX.Element} - The tab navigation indicator.
 */
const NavigationThumb = ({ selectedThumb }: Props): JSX.Element => (
    <SafeAreaView
        style = { styles.navigationThumbContainer }>
        {
            Object.values(THUMBS)
                .map(value => 
                    (<Icon
                        key = { `thumb-${value.toLowerCase()}` }
                        size = { 8 }
                        color = { value  === selectedThumb ? ICON_ACTIVE_COLOR : ICON_INACTIVE_COLOR}
                        src = { IconCircle }
                        style = { styles.navigationThumbIcon } />)
                )
        }
    </SafeAreaView>
);

export default NavigationThumb;
