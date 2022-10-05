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
import { setRequestingSubtitles, toggleLanguageSelectorDialog, updateTranslationLanguage } from '../actions';

import LanguageList from './LanguageList';

interface ILanguageSelectorDialogProps {
    _language: string;
    _translationLanguages: Array<string>;
    _translationLanguagesHead: Array<string>;
    t: Function;
}

/**
 * Component that renders the subtitle language selector dialog.
 *
 * @returns {React$Element<any>}
 */
const LanguageSelectorDialog = ({ _language, _translationLanguages, _translationLanguagesHead }:
                                    ILanguageSelectorDialogProps) => {

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

export default connect(mapStateToProps)(LanguageSelectorDialog);
