import i18next from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import { translate, translateToHTML } from '../../base/i18n/functions';
import { TRANSLATION_LANGUAGES, TRANSLATION_LANGUAGES_HEAD } from '../../base/i18n/i18next';
import Dialog from '../../base/ui/components/web/Dialog';
import { openSettingsDialog } from '../../settings/actions';
import { SETTINGS_TABS } from '../../settings/constants';
import { setRequestingSubtitles, toggleLanguageSelectorDialog, updateTranslationLanguage } from '../actions';

import LanguageList from './LanguageList.web';


interface ILanguageSelectorDialogProps extends WithTranslation {
    _language: string;
    _translationLanguages: Array<string>;
    _translationLanguagesHead: Array<string>;
}

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

/**
 * Component that renders the subtitle language selector dialog.
 *
 * @returns {React$Element<any>}
 */
const LanguageSelectorDialog = ({
    t,
    _language,
    _translationLanguages,
    _translationLanguagesHead
}: ILanguageSelectorDialogProps) => {
    const { classes: styles } = useStyles();
    const dispatch = useDispatch();
    const off = 'transcribing.subtitlesOff';
    const [ language, setLanguage ] = useState(off);

    const languagesHead = _translationLanguagesHead.map((lang: string) => `translation-languages:${lang}`);

    // The off and the head languages are always on the top of the list. But once you are selecting
    // a language from the translationLanguages, that language is moved under the fixedItems list,
    // until a new languages is selected. FixedItems keep their positions.
    const fixedItems = [ off, ...languagesHead ];
    const languages = _translationLanguages
        .map((lang: string) => `translation-languages:${lang}`)
        .filter((lang: string) => !(lang === language || languagesHead.includes(lang)));

    const listItems = (fixedItems.includes(language)
        ? [ ...fixedItems, ...languages ]
        : [ ...fixedItems, language, ...languages ])
        .map((lang, index) => {
            return {
                id: lang + index,
                lang,
                selected: lang === language
            };
        });

    useEffect(() => {
        _language ? setLanguage(_language) : setLanguage(off);
    }, []);

    const onLanguageSelected = useCallback((e: string) => {
        setLanguage(e);
        dispatch(updateTranslationLanguage(e));
        dispatch(setRequestingSubtitles(e !== off));
        dispatch(toggleLanguageSelectorDialog());
    }, [ _language ]);

    const onSourceLanguageClick = useCallback(() => {
        dispatch(openSettingsDialog(SETTINGS_TABS.PROFILE, false));
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
                onLanguageSelected = { onLanguageSelected }
                selectedLanguage = { language } />
        </Dialog>
    );
};

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code LanguageSelectorDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state: IReduxState) {
    const { conference } = state['features/base/conference'];
    const { _language } = state['features/subtitles'];
    const { transcription } = state['features/base/config'];

    const languages = transcription?.translationLanguages ?? TRANSLATION_LANGUAGES;
    const languagesHead = transcription?.translationLanguagesHead ?? TRANSLATION_LANGUAGES_HEAD;

    return {
        _conference: conference,
        _language,
        _translationLanguages: languages,
        _translationLanguagesHead: languagesHead
    };
}

export default translate(connect(mapStateToProps)(LanguageSelectorDialog));
