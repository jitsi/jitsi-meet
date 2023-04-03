/* eslint-disable lines-around-comment  */

import React, { useCallback, useEffect, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { TRANSLATION_LANGUAGES, TRANSLATION_LANGUAGES_HEAD }
    from '../../base/i18n/i18next';
// @ts-ignore
import JitsiScreen from '../../base/modal/components/JitsiScreen';
// @ts-ignore
import { goBack }
    from '../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { setRequestingSubtitles, updateTranslationLanguage } from '../actions.native';

import LanguageList from './LanguageList.native';
// @ts-ignore
import styles from './styles.native';

interface ILanguageSelectorDialogProps extends WithTranslation {
    _language: string;
    _translationLanguages: Array<string>;
    _translationLanguagesHead: Array<string>;
}

/**
 * Component that renders the subtitle language selector dialog.
 *
 * @returns {React$Element<any>}
 */
const LanguageSelectorDialog = ({
    _language,
    _translationLanguages,
    _translationLanguagesHead
}: ILanguageSelectorDialogProps) => {
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
        goBack();
    }, [ _language ]);

    return (
        <JitsiScreen
            disableForcedKeyboardDismiss = { true }
            style = { styles.subtitlesContainer }>
            <LanguageList
                items = { listItems }
                onLanguageSelected = { onLanguageSelected }
                selectedLanguage = { language } />
        </JitsiScreen>
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
