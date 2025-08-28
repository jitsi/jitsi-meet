import React, { useCallback } from 'react';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { goBack }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import AbstractLanguageSelectorDialog, {
    IAbstractLanguageSelectorDialogProps
} from '../AbstractLanguageSelectorDialog';

import LanguageList from './LanguageList';
import styles from './styles';

const LanguageSelectorDialog = (props: IAbstractLanguageSelectorDialogProps) => {
    const { language, listItems, onLanguageSelected, subtitles } = props;

    const onSelected = useCallback((e: string) => {
        onLanguageSelected(e);
        goBack();
    }, [ language ]);

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
