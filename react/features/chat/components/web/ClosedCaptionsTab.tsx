import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconSubtitles } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';
import LanguageSelector from '../../../subtitles/components/web/LanguageSelector';
// @ts-ignore
import AbstractClosedCaptions, { AbstractProps } from '../AbstractClosedCaptions';

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
            ...theme.typography.bodyLongBold,
            color: theme.palette.text02
        }
    };
});

/**
 * Component that displays the subtitles history in a scrollable list.
 *
 * @returns {JSX.Element} - The ClosedCaptionsTab component.
 */
const ClosedCaptionsTab = ({
    canStartSubtitles,
    filteredSubtitles,
    groupedSubtitles,
    isButtonPressed,
    isTranscribing,
    startClosedCaptions
}: AbstractProps): JSX.Element => {
    const { classes, theme } = useStyles();
    const { t } = useTranslation();

    if (!isTranscribing) {
        if (canStartSubtitles) {
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
};

export default AbstractClosedCaptions(ClosedCaptionsTab);
