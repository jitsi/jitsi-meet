import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import Button from '../../../base/ui/components/web/Button';
import { groupMessagesBySender } from '../../../base/util/messageGrouping';
import StartRecordingDialog from '../../../recording/components/Recording/web/StartRecordingDialog';
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
    const isTranscribing = useSelector((state: IReduxState) =>
        state['features/transcribing'].isTranscribing);

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

    const handleStartRecording = useCallback(() => {
        dispatch(openDialog(StartRecordingDialog));
    }, [ dispatch ]);

    if (!isTranscribing) {
        return (
            <div className = { classes.emptyContent }>
                {/* <span>Start recording to enable transcription</span> */}
                <Button
                    accessibilityLabel = 'Start Recording'
                    labelKey = 'dialog.startRecording'
                    onClick = { handleStartRecording }
                    type = 'primary' />
            </div>
        );
    }

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
