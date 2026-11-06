import React, { useCallback, useMemo } from 'react';
import { WithTranslation } from 'react-i18next';
import { ScrollView, StyleProp, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { goBack } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { setAudioTranslationLanguage, setParticipantAudioTranslationLanguage } from '../../actions';
import { getAudioTranslationLanguageLabel, orderAudioTranslationLanguages } from '../../functions';

import AudioTranslationLanguageItem from './AudioTranslationLanguageItem';
import styles from './styles';

interface IProps extends WithTranslation {

    /**
     * Navigation route; params.participantId scopes the selector to one participant.
     */
    route?: { params?: { participantId?: string; }; };
}

/**
 * A screen for selecting the AI audio-translation target language (or off).
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement}
 */
const AudioTranslationDialog = ({ route, t }: IProps) => {
    const participantId = route?.params?.participantId;
    const dispatch = useDispatch();
    const defaultLanguage = useSelector((state: IReduxState) => state['features/audio-translation'].language);
    const participantLanguages
        = useSelector((state: IReduxState) => state['features/audio-translation'].participantLanguages);
    const languagesConfig = useSelector((state: IReduxState) => state['features/base/config'].audioTranslation);

    // Highlight the effective language for the target: the per-participant override if one is set, else the
    // default. (For the conference-wide screen there is no participantId, so this is just the default.)
    const language = participantId && participantId in participantLanguages
        ? participantLanguages[participantId]
        : defaultLanguage;

    // Recomputed only when the config block or the active language changes, not on every store update.
    const languages = useMemo(
        () => orderAudioTranslationLanguages(languagesConfig, language), [ languagesConfig, language ]);

    const onSelect = useCallback((code: string | null) => {
        if (participantId) {
            dispatch(setParticipantAudioTranslationLanguage(participantId, code));
        } else {
            dispatch(setAudioTranslationLanguage(code));
        }
        goBack();
    }, [ dispatch, participantId ]);

    return (
        <JitsiScreen style = { styles.container }>
            <ScrollView
                bounces = { false }
                style = { styles.itemsContainer as StyleProp<ViewStyle> }>
                <AudioTranslationLanguageItem
                    code = { null }
                    label = { t('toolbar.audioTranslationOff') }
                    onSelect = { onSelect }
                    selected = { !language } />
                { languages.map(code => (
                    <AudioTranslationLanguageItem
                        code = { code }
                        key = { code }
                        label = { getAudioTranslationLanguageLabel(code, t) }
                        onSelect = { onSelect }
                        selected = { language === code } />
                )) }
            </ScrollView>
        </JitsiScreen>
    );
};

export default translate(AudioTranslationDialog);
