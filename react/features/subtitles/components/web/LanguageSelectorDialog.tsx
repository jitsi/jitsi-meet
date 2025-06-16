import i18next from 'i18next';
import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import { translate, translateToHTML } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import { openSettingsDialog } from '../../../settings/actions.web';
import { SETTINGS_TABS } from '../../../settings/constants';
import { toggleLanguageSelectorDialog } from '../../actions.web';
import AbstractLanguageSelectorDialog, {
    IAbstractLanguageSelectorDialogProps
} from '../AbstractLanguageSelectorDialog';

import LanguageList from './LanguageList';


const useStyles = makeStyles()(theme => {
    return {
        paragraphWrapper: {
            fontSize: 14,
            margin: '10px 0px',
            color: theme.palette.text01
        },
        spanWrapper: {
            fontWeight: 700,
            cursor: 'pointer',
            color: theme.palette.link01,
            '&:hover': {
                backgroundColor: theme.palette.ui04,
                color: theme.palette.link01Hover
            }
        }
    };
});


const LanguageSelectorDialog = (props: IAbstractLanguageSelectorDialogProps) => {
    const { dispatch, language, listItems, onLanguageSelected, subtitles, t } = props;

    const { classes: styles } = useStyles();

    const onSelected = useCallback((e: string) => {
        onLanguageSelected(e);
        dispatch(toggleLanguageSelectorDialog());
    }, [ language ]);

    const onSourceLanguageClick = useCallback(() => {
        dispatch(openSettingsDialog(SETTINGS_TABS.MORE, false));
    }, []);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            titleKey = 'transcribing.subtitles'>
            <p className = { styles.paragraphWrapper } >
                {
                    translateToHTML(t, 'transcribing.sourceLanguageDesc', {
                        'sourceLanguage': t(`languages:${i18next.language}`).toLowerCase()
                    })
                }<span
                    className = { styles.spanWrapper }
                    onClick = { onSourceLanguageClick }>{t('transcribing.sourceLanguageHere')}.</span>
            </p>
            <LanguageList
                items = { listItems }
                onLanguageSelected = { onSelected }
                selectedLanguage = { subtitles } />
        </Dialog>
    );
};

/*
 * We apply AbstractLanguageSelector to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default translate(AbstractLanguageSelectorDialog(LanguageSelectorDialog));
