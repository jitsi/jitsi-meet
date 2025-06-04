import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconSubtitles } from '../../../base/icons/svg';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Button from '../../../base/ui/components/web/Button';
import { groupMessagesBySender } from '../../../base/util/messageGrouping';
import { setRequestingSubtitles } from '../../../subtitles/actions.any';
import LanguageSelector from '../../../subtitles/components/web/LanguageSelector';
import { canStartSubtitles } from '../../../subtitles/functions.any';
import { ISubtitle } from '../../../subtitles/types';
import { isTranscribing } from '../../../transcribing/functions';

import { SubtitlesMessagesContainer } from './SubtitlesMessagesContainer';

/**
 * The styles for the ClosedCaptionsTab component.
 */
const useStyles = makeStyles()(theme => {
    return {
        subtitlesList: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            padding: '16px',
            flex: 1,
            boxSizing: 'border-box',
            color: theme.palette.text01
        },
        container: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
        },
        messagesContainer: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden'
        },
        emptyContent: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '16px',
            boxSizing: 'border-box',
            flexDirection: 'column',
            gap: '16px',
            color: theme.palette.text01,
            textAlign: 'center'
        },
        emptyIcon: {
            width: '100px',
            padding: '16px',

            '& svg': {
                width: '100%',
                height: 'auto'
            }
        },
        emptyState: {
            ...withPixelLineHeight(theme.typography.bodyLongBold),
            color: theme.palette.text02
        }
    };
});

/**
 * Component that displays the subtitles history in a scrollable list.
 *
 * @returns {JSX.Element} - The ClosedCaptionsTab component.
 */
export default function ClosedCaptionsTab() {
    const { classes, theme } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const subtitles = useSelector((state: IReduxState) => state['features/subtitles'].subtitlesHistory);
    const language = useSelector((state: IReduxState) => state['features/subtitles']._language);
    const selectedLanguage = language?.replace('translation-languages:', '');
    const _isTranscribing = useSelector(isTranscribing);
    const _canStartSubtitles = useSelector(canStartSubtitles);
    const [ isButtonPressed, setButtonPressed ] = useState(false);
    const subtitlesError = useSelector((state: IReduxState) => state['features/subtitles']._hasError);

    const filteredSubtitles = useMemo(() => {
        // First, create a map of transcription messages by message ID
        const transcriptionMessages = new Map(
            subtitles
                .filter(s => s.isTranscription)
                .map(s => [ s.id, s ])
        );

        if (!selectedLanguage) {
            // When no language is selected, show all original transcriptions
            return Array.from(transcriptionMessages.values());
        }

        // Then, create a map of translation messages by message ID
        const translationMessages = new Map(
            subtitles
                .filter(s => !s.isTranscription && s.language === selectedLanguage)
                .map(s => [ s.id, s ])
        );

        // When a language is selected, for each transcription message:
        // 1. Use its translation if available
        // 2. Fall back to the original transcription if no translation exists
        return Array.from(transcriptionMessages.values())
            .filter((m: ISubtitle) => !m.interim)
            .map(m => translationMessages.get(m.id) ?? m);
    }, [ subtitles, selectedLanguage ]);

    const groupedSubtitles = useMemo(() =>
        groupMessagesBySender(filteredSubtitles), [ filteredSubtitles ]);

    const startClosedCaptions = useCallback(() => {
        if (isButtonPressed) {
            return;
        }
        dispatch(setRequestingSubtitles(true, false, null));
        setButtonPressed(true);
    }, [ dispatch, isButtonPressed, setButtonPressed ]);

    if (subtitlesError && isButtonPressed) {
        setButtonPressed(false);
    }

    if (!_isTranscribing) {
        if (_canStartSubtitles) {
            return (
                <div className = { classes.emptyContent }>
                    <Button
                        accessibilityLabel = 'Start Closed Captions'
                        appearance = 'primary'
                        disabled = { isButtonPressed }
                        labelKey = 'closedCaptionsTab.startClosedCaptionsButton'
                        onClick = { startClosedCaptions }
                        size = 'large'
                        type = 'primary' />
                </div>
            );
        }

        if (isButtonPressed) {
            setButtonPressed(false);
        }

        return (
            <div className = { classes.emptyContent }>
                <Icon
                    className = { classes.emptyIcon }
                    color = { theme.palette.icon03 }
                    src = { IconSubtitles } />
                <span className = { classes.emptyState }>
                    { t('closedCaptionsTab.emptyState') }
                </span>
            </div>
        );
    }

    if (isButtonPressed) {
        setButtonPressed(false);
    }

    return (
        <div className = { classes.container }>
            <LanguageSelector />
            <div className = { classes.messagesContainer }>
                <SubtitlesMessagesContainer
                    groups = { groupedSubtitles }
                    messages = { filteredSubtitles } />
            </div>
        </div>
    );
}
