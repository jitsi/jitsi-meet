import { makeStyles } from '@material-ui/styles';
import React from 'react';


import LanguageListItem from './LanguageListItem';

interface ILanguageListProps {
    items: Array<LanguageItem>,
    onLanguageSelected: (lang: string) => void;
    selectedLanguage: string
}

const useStyles = makeStyles(() => {
    return {
        itemsContainer: {
            display: 'flex',
            flexFlow: 'column'
        }
    };
});


interface LanguageItem {
    id: string,
    lang: string,
    selected: boolean,
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
    const styles = useStyles();
    const listItems = items.map(item => (<LanguageListItem
        key = { item.id }
        lang = { item.lang }
        onLanguageSelected = { onLanguageSelected }
        selected = { item.selected } />));

    return (
        <div className = { styles.itemsContainer }>{listItems}</div>
    );
};

export default LanguageList;
