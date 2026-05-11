import React from 'react';
import { useTranslation } from 'react-i18next';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { DialogProps } from '../../../base/dialog/constants';

interface IProps extends DialogProps {

    /**
     * The name of the remote participant that shared the video.
     */
    actorName: string;

    /**
     * The function to execute when confirmed.
     */
    onSubmit: () => void;

    /**
     * The URL of the video being shared (for transparency).
     */
    videoUrl?: string;
}

/**
 * Dialog to confirm playing a video shared from a remote participant.
 *
 * @returns {JSX.Element}
 */
export default function ShareVideoConfirmDialog({ actorName, onSubmit, videoUrl }: IProps): JSX.Element {
    const { t } = useTranslation();

    // Extract hostname from URL for user awareness
    let displayUrl = '';
    if (videoUrl) {
        try {
            const urlObj = new URL(videoUrl);
            displayUrl = urlObj.hostname;
        } catch (_e) {
            // If not a valid URL, use the videoUrl as-is for display
            displayUrl = videoUrl;
        }
    }

    // Build description with video source info if available
    const description = displayUrl
        ? `${t('dialog.shareVideoConfirmPlay')} (Source: ${displayUrl})`
        : t('dialog.shareVideoConfirmPlay');

    return (
        <ConfirmDialog
            cancelLabel = 'dialog.Cancel'
            confirmLabel = 'dialog.Ok'
            description = { description }
            onSubmit = { onSubmit }
            title = { t('dialog.shareVideoConfirmPlayTitle', {
                name: actorName
            }) } />
    );
}
