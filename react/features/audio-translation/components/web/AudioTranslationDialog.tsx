import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { hideDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import { setAudioTranslationLanguage, setParticipantAudioTranslationLanguage } from '../../actions';
import { getAudioTranslationLanguageLabel, orderAudioTranslationLanguages } from '../../functions';

import AudioTranslationLanguageItem from './AudioTranslationLanguageItem';

interface IProps {

    /**
     * When set, the dialog targets this single participant (overriding the default); otherwise it sets the
     * default language for every speaker.
     */
    participantId?: string;

    /**
     * Invoked to obtain translated strings.
     */
    t: (key: string) => string;
}

const useStyles = makeStyles()(() => {
    return {
        list: {
            display: 'flex',
            flexDirection: 'column'
        }
    };
});

/**
 * A dialog for selecting the AI audio-translation target language (or off).
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement}
 */
const AudioTranslationDialog = ({ participantId, t }: IProps) => {
    const dispatch = useDispatch();
    const { classes: styles } = useStyles();
    const defaultLanguage = useSelector((state: IReduxState) => state['features/audio-translation'].language);
    const participantLanguages
        = useSelector((state: IReduxState) => state['features/audio-translation'].participantLanguages);
    const languagesConfig = useSelector((state: IReduxState) => state['features/base/config'].audioTranslation);

    // Highlight the effective language for the target: the per-participant override if one is set, else the
    // default. (For the conference-wide dialog there is no participantId, so this is just the default.)
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
        dispatch(hideDialog());
    }, [ dispatch, participantId ]);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            titleKey = 'toolbar.audioTranslation'>
            <div className = { styles.list }>
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
            </div>
        </Dialog>
    );
};

export default translate(AudioTranslationDialog);
