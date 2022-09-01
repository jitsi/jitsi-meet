/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';

// @ts-ignore
import { Dialog } from '../../base/dialog';
// @ts-ignore
import { LANGUAGES, TRANSLATION_LANGUAGES_HEAD, TRANSLATION_LANGUAGES_EXCLUDE } from '../../base/i18n';
// @ts-ignore
import { connect } from '../../base/redux';
// @ts-ignore
import { updateTranslationLanguage, setRequestingSubtitles, toggleLangugeSelectorDialog } from '../actions';

import LanguageList from './LanguageList';

interface ILanguageSelectorDialogProps {
    _language: string,
    t: Function,
}

/**
 * Component that renders the subtitle language selector dialog.
 *
 * @returns {React$Element<any>}
 */
const LanguageSelectorDialog = ({ _language }: ILanguageSelectorDialogProps) => {
    const dispatch = useDispatch();
    const off = 'transcribing.subtitlesOff';
    const [ language, setLanguage ] = useState(off);

    const importantLanguages = TRANSLATION_LANGUAGES_HEAD.map((lang: string) => `languages:${lang}`);
    const fixedItems = [ off, ...importantLanguages ];

    const languages = LANGUAGES
        .filter((lang: string) => !TRANSLATION_LANGUAGES_EXCLUDE.includes(lang))
        .map((lang: string) => `languages:${lang}`)
        .filter((lang: string) => !(lang === language || importantLanguages.includes(lang)));

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
        dispatch(toggleLangugeSelectorDialog());
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
function mapStateToProps(state: any) {
    const {
        conference
    } = state['features/base/conference'];

    const {
        _language
    } = state['features/subtitles'];

    return {
        _conference: conference,
        _language
    };
}

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(LanguageSelectorDialog);
