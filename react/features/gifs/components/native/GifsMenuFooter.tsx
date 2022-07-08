import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';

import styles from './styles';


/**
 * Implements the gifs menu footer component.
 *
 * @returns { JSX.Element} - The gifs menu footer component.
 */
const GifsMenuFooter = (): JSX.Element => {
    const { t } = useTranslation();

    return(
        <View style={ styles.credit }>
            <Text
                style={ styles.creditText }>{ t('poweredby') }</Text>
            <Image
                source = { require('../../../../../images/GIPHY_logo.png') } />
        </View>
    )
};

export default GifsMenuFooter;
