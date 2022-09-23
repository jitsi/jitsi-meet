/* eslint-disable lines-around-comment */
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { IState } from '../../app/types';
// @ts-ignore
import { Dialog } from '../../base/dialog';
// @ts-ignore
import { TRANSLATION_LANGUAGES, TRANSLATION_LANGUAGES_HEAD } from '../../base/i18n';
import { connect } from '../../base/redux/functions';
// @ts-ignore
import { updateTranslationLanguage, setRequestingSubtitles, toggleLanguageSelectorDialog } from '../actions';

import LanguageList from './LanguageList';

interface ILanguageSelectorDialogProps {
    _language: string;
    t: Function;
    translationLanguages: Array<string>;
    translationLanguagesHead: Array<string>;
}

/**
 * Component that renders the subtitle language selector dialog.
 *
 * @returns {React$Element<any>}
 */
const LanguageSelectorDialog = ({ _language, translationLanguages, translationLanguagesHead }:
                                    ILanguageSelectorDialogProps) => {

    const dispatch = useDispatch();
    const off = 'transcribing.subtitlesOff';
    const [ language, setLanguage ] = useState(off);

    const languagesHead = translationLanguagesHead.map((lang: string) => `translation-languages:${lang}`);
    const fixedItems = [ off, ...languagesHead ];
    const languages = translationLanguages
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

    return (
        <Dialog
            hideCancelButton = { true }
            submitDisabled = { true }
            titleKey = 'transcribing.subtitles'
            width = { 'small' }>
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
function mapStateToProps(state: IState) {
    const { conference } = state['features/base/conference'];
    const { _language } = state['features/subtitles'];
    const { i18n } = state['features/base/config'];

    const languages = i18n?.translationLanguages || TRANSLATION_LANGUAGES;
    const languagesHead = i18n?.translationLanguagesHead || TRANSLATION_LANGUAGES_HEAD;

    return {
        _conference: conference,
        _language,
        translationLanguages: languages,
        translationLanguagesHead: languagesHead
    };
}

export default connect(mapStateToProps)(LanguageSelectorDialog);
