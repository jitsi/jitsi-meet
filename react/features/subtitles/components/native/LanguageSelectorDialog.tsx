import React, { useCallback } from 'react';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { goBack, navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import AbstractLanguageSelectorDialog, {
    IAbstractLanguageSelectorDialogProps
} from '../AbstractLanguageSelectorDialog';

import LanguageList from './LanguageList';
import styles from './styles';

const LanguageSelectorDialog = (props: IAbstractLanguageSelectorDialogProps) => {
    const { language, listItems, onLanguageSelected, startWithRecordingDialog, subtitles } = props;

    const onSelected = useCallback((e: string) => {
        if (startWithRecordingDialog) {
            navigate(screen.conference.recording, { recordAudioAndVideo: false });
        } else {
            onLanguageSelected(e);
            goBack();
        }
    }, [ startWithRecordingDialog, language ]);

    return (
        <JitsiScreen
            disableForcedKeyboardDismiss = { true }
            style = { styles.subtitlesContainer }>
            <LanguageList
                items = { listItems }
                onLanguageSelected = { onSelected }
                selectedLanguage = { subtitles } />
        </JitsiScreen>
    );
};

/*
 * We apply AbstractLanguageSelector to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractLanguageSelectorDialog(LanguageSelectorDialog);
