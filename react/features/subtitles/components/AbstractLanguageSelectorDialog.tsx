import React, { ComponentType, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import { openDialog } from '../../base/dialog/actions';
import { StartRecordingDialog } from '../../recording/components/Recording/index';
import { setRequestingSubtitles } from '../actions.any';
import { getAvailableSubtitlesLanguages } from '../functions.any';

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

    const onLanguageSelected = useCallback((value: string) => {
        const _selectedLanguage = value === noLanguageLabel ? null : value;
        const enabled = Boolean(_selectedLanguage);
        const displaySubtitles = enabled;

        if (conference?.getMetadataHandler()?.getMetadata()?.asyncTranscription) {
            dispatch(openDialog('StartRecordingDialog', StartRecordingDialog, {
                recordAudioAndVideo: false
            }));
        } else {
            dispatch(setRequestingSubtitles(enabled, displaySubtitles, _selectedLanguage));
        }
    }, [ conference, language ]);

    return (
        <Component
            dispatch = { dispatch }
            language = { language }
            listItems = { listItems }
            onLanguageSelected = { onLanguageSelected }
            subtitles = { selected }
            t = { t } />
    );
};

export default AbstractLanguageSelectorDialog;
