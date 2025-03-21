import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { groupMessagesBySender } from '../../../base/util/messageGrouping';
import LanguageSelector from '../../../subtitles/components/web/LanguageSelector';
import { ISubtitle } from '../../../subtitles/types';

import { SubtitlesGroup } from './SubtitlesGroup';

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
            height: '100%'
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
    const subtitles: ISubtitle[] = useSelector(state => state['features/subtitles'].subtitlesHistory);
    const selectedLanguage = useSelector(state => state['features/subtitles']._language);

    const filteredSubtitles = useMemo(() => {
        // First, create a map of transcription messages by message ID
        const transcriptionMessages = new Map(
            subtitles
                .filter(s => s.isTranscription)
                .map(s => [ s.id, s ])
        );

        // Then, create a map of translation messages by message ID
        const translationMessages = new Map(
            subtitles
                .filter(s => !s.isTranscription && s.language === selectedLanguage)
                .map(s => [ s.id, s ])
        );

        if (!selectedLanguage) {
            // When no language is selected, show all original transcriptions
            return Array.from(transcriptionMessages.values());
        }

        // When a language is selected, for each transcription message:
        // 1. Use its translation if available
        // 2. Fall back to the original transcription if no translation exists
        return Array.from(transcriptionMessages.keys()).map(
            id => translationMessages.get(id) || transcriptionMessages.get(id))
            .filter(s => typeof s !== 'undefined');
    }, [ subtitles, selectedLanguage ]);

    const groupedSubtitles = useMemo(() =>
        groupMessagesBySender(filteredSubtitles), [ filteredSubtitles ]);

    return (
        <div className = { classes.container }>
            <LanguageSelector />
            <div className = { classes.subtitlesList }>
                {groupedSubtitles.map(group => (
                    <SubtitlesGroup
                        key = { `${group.senderId}-${group.messages[0].timestamp}` }
                        messages = { group.messages }
                        senderId = { group.senderId } />
                ))}
            </div>
        </div>
    );
}
