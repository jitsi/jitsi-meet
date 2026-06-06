import React from 'react';
import { makeStyles } from 'tss-react/mui';


import LanguageListItem from './LanguageListItem';

interface ILanguageListProps {
    items: Array<ILanguageItem>;
    onLanguageSelected: (lang: string) => void;
    selectedLanguage: string;
}

const useStyles = makeStyles()(() => {
    return {
        itemsContainer: {
            display: 'flex',
            flexFlow: 'column'
        }
    };
});


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
const LanguageList = ({
    items,
    onLanguageSelected
}: ILanguageListProps) => {
    const { classes: styles } = useStyles();
    const listItems = items.map(item => (
        <LanguageListItem
            key = { item.id }
            lang = { item.lang }
            onLanguageSelected = { onLanguageSelected }
            selected = { item.selected } />
    ));

    return (
        <div className = { styles.itemsContainer }>{listItems}</div>
    );
};

export default LanguageList;
