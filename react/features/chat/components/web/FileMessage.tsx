import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { downloadFile, removeFile } from '../../../file-sharing/actions';
import FileItem from '../../../file-sharing/components/web/FileItem';
import { isFileUploadingEnabled } from '../../../file-sharing/functions.any';
import { IMessage } from '../../types';

/**
 * Props for the FileMessage component.
 */
interface IFileMessageProps {

    /**
     * Additional CSS class name.
     */
    className?: string;

    /**
     * The message containing file metadata.
     */
    message: IMessage;

    /**
     * Screen reader help text for accessibility.
     */
    screenReaderHelpText?: string;
}

const useStyles = makeStyles()(theme => {
    return {
        fileMessageContainer: {
            margin: `${theme.spacing(1)} 0`,
            maxWidth: '100%',
            minWidth: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',

            // Override FileItem styles for compact chat display
            '& .fileItem': {
                padding: theme.spacing(2), // Reduced from 3 (24px → 16px)
                gap: theme.spacing(2), // Reduced from 3

                // Add background to button container to hide text underneath in chat context
                '& > div:last-child': {
                    backgroundColor: theme.palette.ui02,
                    paddingLeft: theme.spacing(2)
                },

                '&:hover > div:last-child': {
                    backgroundColor: theme.palette.ui03
                }
            },

            '& .fileName': {
                ...theme.typography.bodyShortRegular // Match message text font
            },

            '& .fileSize': {
                ...theme.typography.labelRegular // Keep smaller for metadata
            }
        },
        deletedFileMessage: {
            ...theme.typography.bodyShortRegular,
            fontStyle: 'italic',
            color: theme.palette.text02,
            padding: theme.spacing(1, 0)
        }
    };
});

/**
 * Component for displaying file messages in chat.
 *
 * @param {IFileMessageProps} props - The component props.
 * @returns {JSX.Element | null} The FileMessage component or null if no file metadata.
 */
const FileMessage = ({ className = '', message, screenReaderHelpText }: IFileMessageProps) => {
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const isUploadEnabled = useSelector(isFileUploadingEnabled);

    /**
     * Handles the download action for a file.
     *
     * @param {string} fileId - The ID of the file to download.
     * @returns {void}
     */
    const handleDownload = useCallback((fileId: string) => {
        dispatch(downloadFile(fileId));
    }, [ dispatch ]);

    /**
     * Handles the remove action for a file.
     *
     * @param {string} fileId - The ID of the file to remove.
     * @returns {void}
     */
    const handleRemove = useCallback((fileId: string) => {
        dispatch(removeFile(fileId));
    }, [ dispatch ]);

    if (!message.fileMetadata) {
        return null;
    }

    // If the file has been deleted, show a deletion message instead of the file item.
    if (message.fileMetadata.isDeleted) {
        return (
            <div className = { cx(classes.fileMessageContainer, className) }>
                <div className = { classes.deletedFileMessage }>
                    {t('chat.fileDeleted')}
                </div>
            </div>
        );
    }

    return (
        <div className = { cx(classes.fileMessageContainer, className) }>
            {screenReaderHelpText && (
                <span className = 'sr-only'>
                    {screenReaderHelpText}
                </span>
            )}
            <FileItem
                actionsVisible = { true }
                className = 'fileItem'
                file = { message.fileMetadata }
                iconSize = { 40 }
                onDownload = { handleDownload }
                onRemove = { handleRemove }
                showAuthor = { false }
                showRemoveButton = { isUploadEnabled }
                showTimestamp = { false } />
        </div>
    );
};

export default FileMessage;
