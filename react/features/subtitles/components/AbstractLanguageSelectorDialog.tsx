import React, { ComponentType, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import {
    TRANSLATION_LANGUAGES,
    TRANSLATION_LANGUAGES_HEAD
} from '../../base/i18n/i18next';
import { setRequestingSubtitles } from '../actions.any';


export interface IAbstractLanguageSelectorDialogProps {
    dispatch: IStore['dispatch'];
    language: string | null;
    listItems: Array<any>;
    onLanguageSelected: (e: string) => void;
    subtitles: string;
    t: Function;
}


/**
 * Higher Order Component taking in a concrete LanguageSelector component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.Component} Component - The concrete component.
 * @returns {React.Component}
 */
const AbstractLanguageSelectorDialog = (Component: ComponentType<IAbstractLanguageSelectorDialogProps>) => () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const noLanguageLabel = 'transcribing.subtitlesOff';

    const language = useSelector((state: IReduxState) => state['features/subtitles']._language);
    const subtitles = language ?? noLanguageLabel;

    const transcription = useSelector((state: IReduxState) => state['features/base/config'].transcription);
    const translationLanguagesHead = transcription?.translationLanguagesHead ?? TRANSLATION_LANGUAGES_HEAD;
    const languagesHead = translationLanguagesHead?.map((lang: string) => `translation-languages:${lang}`);

    // The off and the head languages are always on the top of the list. But once you are selecting
    // a language from the translationLanguages, that language is moved under the fixedItems list,
    // until a new languages is selected. FixedItems keep their positions.
    const fixedItems = [ noLanguageLabel, ...languagesHead ];
    const translationLanguages = transcription?.translationLanguages ?? TRANSLATION_LANGUAGES;
    const languages = translationLanguages
        .map((lang: string) => `translation-languages:${lang}`)
        .filter((lang: string) => !(lang === subtitles || languagesHead?.includes(lang)));
    const listItems = (fixedItems?.includes(subtitles)
        ? [ ...fixedItems, ...languages ]
        : [ ...fixedItems, subtitles, ...languages ])
        .map((lang, index) => {
            return {
                id: lang + index,
                lang,
                selected: lang === subtitles
            };
        });

    const onLanguageSelected = useCallback((value: string) => {
        const selectedLanguage = value === noLanguageLabel ? null : value;
        const enabled = Boolean(selectedLanguage);
        const displaySubtitles = enabled;

        dispatch(setRequestingSubtitles(enabled, displaySubtitles, selectedLanguage));
    }, [ language ]);

    return (
        <Component
            dispatch = { dispatch }
            language = { language }
            listItems = { listItems }
            onLanguageSelected = { onLanguageSelected }
            subtitles = { subtitles }
            t = { t } />
    );
};

export default AbstractLanguageSelectorDialog;
