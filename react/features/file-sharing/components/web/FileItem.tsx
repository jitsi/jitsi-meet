import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Avatar from '../../../base/avatar/components/Avatar';
import Icon from '../../../base/icons/components/Icon';
import { IconDownload, IconTrash } from '../../../base/icons/svg';
import BaseTheme from '../../../base/ui/components/BaseTheme.web';
import {
    formatFileSize,
    formatTimestamp,
    getFileIcon
} from '../../functions.any';
import { IFileMetadata } from '../../types';

/**
 * Props for the FileItem component.
 */
interface IFileItemProps {

    /**
     * Whether to show action buttons (download, remove).
     */
    actionsVisible?: boolean;

    /**
     * Additional CSS class name.
     */
    className?: string;

    /**
     * The file metadata to display.
     */
    file: IFileMetadata;

    /**
     * Size of the file icon in pixels (default: 64).
     */
    iconSize?: number;

    /**
     * Callback function when download button is clicked.
     */
    onDownload?: (fileId: string) => void;

    /**
     * Callback function when remove button is clicked.
     */
    onRemove?: (fileId: string) => void;

    /**
     * Whether to show the author/uploader information.
     */
    showAuthor?: boolean;

    /**
     * Whether to show the remove button.
     */
    showRemoveButton?: boolean;

    /**
     * Whether to show the timestamp.
     */
    showTimestamp?: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        buttonContainer: {
            alignItems: 'center',
            bottom: 0,
            display: 'flex',
            justifyContent: 'end',
            gap: theme.spacing(2),
            position: 'absolute',
            right: theme.spacing(3),
            top: 0
        },

        fileIconContainer: {
            display: 'flex',
            flexShrink: 0,
            margin: 'auto'
        },

        fileItem: {
            backgroundColor: theme.palette.ui02,
            borderRadius: theme.shape.borderRadius,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            gap: theme.spacing(3),
            justifyContent: 'space-between',
            maxWidth: '100%',
            minWidth: 0,
            padding: theme.spacing(3),
            position: 'relative',

            '& .actionIconVisibility': {
                opacity: 0,
                transition: 'opacity 0.2s'
            },

            '& .timestampVisibility': {
                opacity: 1
            },

            '&:hover': {
                backgroundColor: theme.palette.ui03,

                '& .actionIconVisibility': {
                    opacity: 1
                },

                '& .timestampVisibility': {
                    opacity: 0
                }
            },

            '&.focused .actionIconVisibility': {
                opacity: 1
            },

            '&.focused .timestampVisibility': {
                opacity: 0
            }
        },

        fileItemDetails: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            gap: theme.spacing(1),
            justifyContent: 'center',
            minWidth: 0,
            overflow: 'hidden'
        },

        fileName: {
            ...theme.typography.labelBold,
            gap: theme.spacing(1),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },

        fileAuthorParticipant: {
            alignItems: 'center',
            display: 'inline-flex',
            gap: theme.spacing(1)
        },

        fileAuthorParticipantName: {
            ...theme.typography.labelBold,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },

        fileSize: {
            ...theme.typography.labelRegular
        },

        fileTimestamp: {
            ...theme.typography.labelRegular,
            display: 'flex',
            lineHeight: '1.2rem',
            marginTop: theme.spacing(1),
            textAlign: 'center'
        },

        iconButton: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '8px',
            padding: 0,

            '&:focus-visible': {
                outline: `2px solid ${theme.palette.action01}`,
                borderRadius: '4px'
            }
        },

        progressBar: {
            backgroundColor: theme.palette.ui03,
            borderRadius: theme.shape.borderRadius,
            height: 4,
            overflow: 'hidden',
            width: '100%'
        },

        progressFill: {
            backgroundColor: theme.palette.action01,
            height: '100%',
            transition: 'width 0.3s ease'
        }
    };
});

/**
 * Component for displaying file information in a consistent way across the application.
 *
 * @param {IFileItemProps} props - The component props.
 * @returns {JSX.Element} The FileItem component.
 */
const FileItem = ({
    actionsVisible = true,
    className = '',
    file,
    iconSize = 64,
    onDownload,
    onRemove,
    showAuthor = true,
    showRemoveButton = false,
    showTimestamp = true
}: IFileItemProps) => {
    const { classes, cx } = useStyles();
    const [ isFocused, setIsFocused ] = useState(false);
    const { t } = useTranslation();
    const isUploading = (file.progress ?? 100) < 100;

    /**
     * Handles the download button click.
     *
     * @returns {void}
     */
    const handleDownload = useCallback(() => {
        onDownload?.(file.fileId);
    }, [ onDownload, file.fileId ]);

    /**
     * Handles the remove button click.
     *
     * @returns {void}
     */
    const handleRemove = useCallback(() => {
        onRemove?.(file.fileId);
    }, [ onRemove, file.fileId ]);

    /**
     * Handles blur event to remove focus state.
     *
     * @param {React.FocusEvent} e - The blur event.
     * @returns {void}
     */
    const handleBlur = useCallback((e: React.FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsFocused(false);
        }
    }, []);

    /**
     * Handles focus event to set focus state.
     *
     * @returns {void}
     */
    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    return (
        <div
            className = { cx(classes.fileItem, isFocused && 'focused', className) }
            key = { file.fileId }
            onBlur = { handleBlur }
            onFocus = { handleFocus }
            tabIndex = { -1 }
            title = { file.fileName }>
            {
                !isUploading && (
                    <>
                        <div className = { classes.fileIconContainer }>
                            <Icon
                                color = { BaseTheme.palette.icon01 }
                                size = { iconSize }
                                src = { getFileIcon(file.fileType) } />
                        </div>
                        <div className = { classes.fileItemDetails }>
                            <div className = { cx(classes.fileName, 'fileName') }>
                                { file.fileName }
                            </div>
                            <div className = { cx(classes.fileSize, 'fileSize') }>
                                { formatFileSize(file.fileSize) }
                            </div>
                            {
                                showAuthor && (
                                    <div className = { classes.fileAuthorParticipant }>
                                        <Avatar
                                            displayName = { file.authorParticipantName }
                                            participantId = { file.authorParticipantId }
                                            size = { 16 } />
                                        <div className = { classes.fileAuthorParticipantName }>
                                            { file.authorParticipantName }
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                        {
                            showTimestamp && (
                                <div className = { `${classes.fileTimestamp} timestampVisibility` }>
                                    <pre>
                                        { formatTimestamp(file.timestamp) }
                                    </pre>
                                </div>
                            )
                        }
                        {
                            actionsVisible && (
                                <div className = { `${classes.buttonContainer} actionIconVisibility` }>
                                    {
                                        onDownload && (
                                            <button
                                                aria-label = { `${t('fileSharing.downloadFile')} ${file.fileName}` }
                                                className = { classes.iconButton }
                                                onClick = { handleDownload }
                                                type = 'button'>
                                                <Icon
                                                    color = { BaseTheme.palette.icon01 }
                                                    size = { 24 }
                                                    src = { IconDownload } />
                                            </button>
                                        )
                                    }

                                    {
                                        showRemoveButton && onRemove && (
                                            <button
                                                aria-label = { `${t('fileSharing.removeFile')} ${file.fileName}` }
                                                className = { classes.iconButton }
                                                onClick = { handleRemove }
                                                type = 'button'>
                                                <Icon
                                                    color = { BaseTheme.palette.icon01 }
                                                    size = { 24 }
                                                    src = { IconTrash } />
                                            </button>
                                        )
                                    }
                                </div>
                            )
                        }
                    </>
                )
            }
            {
                isUploading && (
                    <div
                        aria-label = { t('fileSharing.fileUploadProgress') }
                        aria-valuemax = { 100 }
                        aria-valuemin = { 0 }
                        aria-valuenow = { file.progress }
                        className = { classes.progressBar }
                        role = 'progressbar'>
                        <div
                            className = { classes.progressFill }
                            style = {{ width: `${file.progress}%` }} />
                    </div>
                )
            }
        </div>
    );
};

export default FileItem;
