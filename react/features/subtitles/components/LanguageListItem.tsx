// @ts-ignore
import { makeStyles } from '@material-ui/styles';
import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';

// @ts-ignore
// eslint-disable-next-line import/order
import { translate } from '../../base/i18n';

// @ts-ignore
import { Icon } from '../../base/icons/components';
import { IconCheck } from '../../base/icons/svg/index';
import { Theme } from '../../base/ui/types';

interface ILanguageListItemProps extends WithTranslation {

    /**
     * Whether or not the button should be full width.
     */
    lang: string,

    /**
     * Click callback.
     */
    onLanguageSelected: (lang: string) => void;

    /**
     * The id of the button.
     */
    selected?: boolean;
}

const useStyles = makeStyles((theme: Theme) => {
    return {
        itemContainer: {
            display: 'flex',
            color: theme.palette.text01,
            alignItems: 'center',
            fontSize: '14px'
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
    const styles = useStyles();
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
