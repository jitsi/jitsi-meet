import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Button from '../../../base/ui/components/web/Button';
import { groupMessagesBySender } from '../../../base/util/messageGrouping';
import { setRequestingSubtitles } from '../../../subtitles/actions.any';
import LanguageSelector from '../../../subtitles/components/web/LanguageSelector';
import { canStartSubtitles } from '../../../subtitles/functions.any';
import { ISubtitle } from '../../../subtitles/types';
import { isRecorderTranscriptionsRunning } from '../../../transcribing/functions';

import { SubtitlesMessagesContainer } from './SubtitlesMessagesContainer';

/**
 * The styles for the SubtitlesTab component.
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
        }
    };
});

/**
 * Component that displays the subtitles history in a scrollable list.
 *
 * @returns {JSX.Element} - The SubtitlesTab component.
 */
export default function SubtitlesTab() {
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const subtitles: ISubtitle[] = useSelector(state => state['features/subtitles'].subtitlesHistory);
    const language = useSelector(state => state['features/subtitles']._language);
    const selectedLanguage = language?.replace('translation-languages:', '');
    const isTranscribing = useSelector(isRecorderTranscriptionsRunning);
    const _canStartSubtitles = useSelector(canStartSubtitles);

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
            .filter((t: ISubtitle) => !t.interim)
            .map(t => translationMessages.get(t.id) ?? t);
    }, [ subtitles, selectedLanguage ]);

    const groupedSubtitles = useMemo(() =>
        groupMessagesBySender(filteredSubtitles), [ filteredSubtitles ]);

    const startClosedCaptions = useCallback(() => {
        dispatch(setRequestingSubtitles(true));
    }, [ dispatch ]);

    if (!isTranscribing) {
        return (
            <div className = { classes.emptyContent }>
                <Button
                    accessibilityLabel = 'Start Closed Captions'
                    appearance = 'primary'
                    labelKey = 'closedCaptionsTab.startClosedCaptionsButton'
                    onClick = { startClosedCaptions }
                    size = 'large'
                    type = 'primary' />
            </div>
        );
    } else if (!_canStartSubtitles) {
        return (
            <div className = { classes.emptyContent }>
                <span>
                    { 'closedCaptionsTab.emptyState' }
                </span>
            </div>
        );
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
