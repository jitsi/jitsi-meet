import React, { ComponentType, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import { isTranscribing } from '../../transcribing/functions';
import { setRequestingSubtitles } from '../actions.any';
import { getAvailableSubtitlesLanguages, isTranslationEnabled } from '../functions.any';

export interface IAbstractLanguageSelectorDialogProps {
    dispatch: IStore['dispatch'];
    language: string | null;
    listItems: Array<any>;
    onLanguageSelected: (e: string) => void;

    /**
     * Whether picking a language should open the recording/transcription dialog instead of applying the language.
     *
     * With async transcription there is no transcriber to dial: transcription is started through room metadata, from
     * that dialog. So the first pick has to go there. Once transcription is running, picking a language just applies
     * it, like it always has.
     */
    startWithRecordingDialog: boolean;
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
    const language = useSelector((state: IReduxState) => state['features/subtitles']._language);

    // The value for the selected language contains "translation-languages:" prefix.
    const selectedLanguage = language?.replace('translation-languages:', '');
    const languageCodes = useSelector((state: IReduxState) => getAvailableSubtitlesLanguages(state, selectedLanguage));

    const noLanguageLabel = 'transcribing.subtitlesOff';
    const selected = language ?? noLanguageLabel;
    const items = [ noLanguageLabel, ...languageCodes.map((lang: string) => `translation-languages:${lang}`) ];
    const listItems = items
        .map((lang, index) => {
            return {
                id: lang + index,
                lang,
                selected: lang === selected
            };
        });
    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);
    const translationEnabled = useSelector(isTranslationEnabled);
    const asyncTranscription = Boolean(conference?.getMetadataHandler()?.getMetadata()?.asyncTranscription);
    const transcribing = useSelector(isTranscribing);
    const startWithRecordingDialog = asyncTranscription && !transcribing;

    const onLanguageSelected = useCallback((value: string) => {
        const _selectedLanguage = value === noLanguageLabel ? null : value;
        const enabled = Boolean(_selectedLanguage);
        const displaySubtitles = enabled;

        dispatch(setRequestingSubtitles(enabled, displaySubtitles, _selectedLanguage));
    }, [ language ]);

    if (!translationEnabled) {
        return null;
    }

    return (
        <Component
            dispatch = { dispatch }
            language = { language }
            listItems = { listItems }
            onLanguageSelected = { onLanguageSelected }
            startWithRecordingDialog = { startWithRecordingDialog }
            subtitles = { selected }
            t = { t } />
    );
};

export default AbstractLanguageSelectorDialog;
