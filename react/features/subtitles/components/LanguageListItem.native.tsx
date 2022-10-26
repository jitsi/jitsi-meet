import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { TouchableHighlight, View } from 'react-native';
import { Text } from 'react-native-paper';

import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconCheck } from '../../base/icons/svg';

import styles from './styles.native';

interface ILanguageListItemProps extends WithTranslation {

    /**
     * Whether or not the button should be full width.
     */
    lang: string;

    /**
     * Click callback.
     */
    onLanguageSelected: (lang: string) => void;

    /**
     * The id of the button.
     */
    selected?: boolean;
}

/**
 * Component that renders the language list item.
 *
 * @returns {React$Element<any>}
 */

const LanguageListItem = ({ t, lang, selected, onLanguageSelected
}: ILanguageListItemProps) => {

    const onLanguageSelectedWrapper
        = useCallback(() => onLanguageSelected(lang), [ lang ]);

    return (
        <View style = { styles.languageItemWrapper }>
            <View style = { styles.iconWrapper }>
                {
                    selected
                    && <Icon
                        size = { 20 }
                        src = { IconCheck } />
                }
            </View>
            <TouchableHighlight
                onPress = { onLanguageSelectedWrapper }
                underlayColor = { 'transparent' } >
                <Text
                    style = { [
                        styles.languageItemText,
                        selected && styles.activeLanguageItemText ] }>
                    { t(lang) }
                </Text>
            </TouchableHighlight>
        </View>
    );
};

export default translate(LanguageListItem);
