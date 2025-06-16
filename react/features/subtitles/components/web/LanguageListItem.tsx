import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconCheck } from '../../../base/icons/svg';

interface ILanguageListItemProps extends WithTranslation {

    /**
     * Language string.
     */
    lang: string;

    /**
     * Callback for language selection.
     */
    onLanguageSelected: (lang: string) => void;

    /**
     * If language item is selected or not.
     */
    selected?: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        itemContainer: {
            display: 'flex',
            color: theme.palette.text02,
            alignItems: 'center',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '5px 0',
            '&:hover': {
                backgroundColor: theme.palette.ui04
            }
        },
        iconWrapper: {
            margin: '4px 10px',
            width: '22px',
            height: '22px'
        },
        activeItemContainer: {
            fontWeight: 700
        }
    };
});

/**
 * Component that renders the language list item.
 *
 * @returns {React$Element<any>}
 */

const LanguageListItem = ({
    t,
    lang,
    selected,
    onLanguageSelected
}: ILanguageListItemProps) => {
    const { classes: styles } = useStyles();
    const onLanguageSelectedWrapper = useCallback(() => onLanguageSelected(lang), [ lang ]);

    return (
        <div
            className = { `${styles.itemContainer} ${selected ? styles.activeItemContainer : ''}` }
            onClick = { onLanguageSelectedWrapper }>
            <span className = { styles.iconWrapper }>{ selected
                && <Icon src = { IconCheck } /> }</span>
            { t(lang) }
        </div>
    );
};

export default translate(LanguageListItem);
