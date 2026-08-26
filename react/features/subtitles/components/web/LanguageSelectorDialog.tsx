import i18next from 'i18next';
import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import { openDialog } from '../../../base/dialog/actions';
import { translate, translateToHTML } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import { RecordingTranscriptionDialog } from '../../../recording/components/Recording';
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
            fontSize: '0.875rem',
            margin: '10px 0px',
            color: theme.palette.dialogText
        },
        spanWrapper: {
            fontWeight: 700,
            cursor: 'pointer',
            color: theme.palette.link01,
            '&:hover': {
                backgroundColor: theme.palette.languageSelectorHover,
                color: theme.palette.link01Hover
            }
        }
    };
});


const LanguageSelectorDialog = (props: IAbstractLanguageSelectorDialogProps) => {
    const { asyncTranscription, dispatch, language, listItems, onLanguageSelected, subtitles, t } = props;

    const { classes: styles } = useStyles();

    const onSelected = useCallback((e: string) => {
        if (asyncTranscription) {
            dispatch(openDialog('RecordingTranscriptionDialog', RecordingTranscriptionDialog, {
                recordAudioAndVideo: false
            }));
        } else {
            onLanguageSelected(e);
        }
        dispatch(toggleLanguageSelectorDialog());
    }, [ asyncTranscription, language ]);

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
