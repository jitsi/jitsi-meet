import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { hideDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import { setAudioTranslationLanguage } from '../../actions';
import { SUPPORTED_TRANSLATION_LANGUAGES } from '../../constants';

import AudioTranslationLanguageItem from './AudioTranslationLanguageItem';

interface IProps {

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
 * A dialog for selecting the AI audio-translation target language (or turning it
 * off). Selecting an option updates the audio-translation redux state, which
 * drives the conference translation request, and closes the dialog.
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement}
 */
const AudioTranslationDialog = ({ t }: IProps) => {
    const dispatch = useDispatch();
    const { classes: styles } = useStyles();
    const language = useSelector((state: IReduxState) => state['features/audio-translation'].language);

    const onSelect = useCallback((code: string | null) => {
        dispatch(setAudioTranslationLanguage(code));
        dispatch(hideDialog());
    }, [ dispatch ]);

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
                { SUPPORTED_TRANSLATION_LANGUAGES.map(({ code, label }) => (
                    <AudioTranslationLanguageItem
                        code = { code }
                        key = { code }
                        label = { label }
                        onSelect = { onSelect }
                        selected = { language === code } />
                )) }
            </div>
        </Dialog>
    );
};

export default translate(AudioTranslationDialog);
