import React from 'react';
import { ScrollView } from 'react-native';

import LanguageListItem from './LanguageListItem';
import styles from './styles';

interface ILanguageListProps {
    items: Array<ILanguageItem>;
    onLanguageSelected: (lang: string) => void;
    selectedLanguage: string;
}

interface ILanguageItem {
    id: string;
    lang: string;
    selected: boolean;
}

/**
 * Component that renders the security options dialog.
 *
 * @returns {React$Element<any>}
 */
const LanguageList = ({ items, onLanguageSelected }: ILanguageListProps) => {

    const listItems = items?.map(item => (
        <LanguageListItem
            key = { item.id }
            lang = { item.lang }
            onLanguageSelected = { onLanguageSelected }
            selected = { item.selected } />
    ));

    return (
        <ScrollView
            bounces = { false }
            style = { styles.itemsContainer }>
            { listItems }
        </ScrollView>
    );
};

export default LanguageList;
