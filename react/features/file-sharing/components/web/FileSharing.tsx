import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import Icon from '../../../base/icons/components/Icon';
import { IconCloudUpload, IconDownload, IconTrash } from '../../../base/icons/svg';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import BaseTheme from '../../../base/ui/components/BaseTheme.web';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { downloadFile, removeFile } from '../../actions';
import {
    formatFileSize,
    formatTimestamp,
    getFileIcon,
    isFileUploadingEnabled,
    processFiles
} from '../../functions.any';

const useStyles = makeStyles()(theme => {
    return {
        buttonContainer: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'end',
            gap: theme.spacing(2),
            position: 'absolute',
            top: 0,
            right: theme.spacing(3),
            bottom: 0,
            left: 0
        },

        container: {
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            margin: '0 auto',
            maxWidth: '600px',
            padding: theme.spacing(3),
            position: 'relative',
            width: '100%'
        },

        dropZone: {
            backgroundColor: theme.palette.ui02,
            border: `2px dashed ${theme.palette.ui03}`,
            borderRadius: theme.shape.borderRadius,
            bottom: 0,
            left: 0,
            opacity: 0,
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 0,

            '&.dragging': {
                backgroundColor: theme.palette.ui03,
                borderColor: theme.palette.action01,
                opacity: 0.8,
                zIndex: 2
            }
        },

        fileIconContainer: {
            display: 'flex',
            margin: 'auto'
        },

        fileItem: {
            backgroundColor: theme.palette.ui02,
            borderRadius: theme.shape.borderRadius,
            display: 'flex',
            flexDirection: 'row',
            gap: theme.spacing(3),
            justifyContent: 'space-between',
            padding: theme.spacing(3),
            position: 'relative',

            '&:hover': {
                backgroundColor: theme.palette.ui03,
                borderRadius: theme.shape.borderRadius,

                '& .actionIconVisibility': {
                    visibility: 'visible'
                },

                '& .timestampVisibility': {
                    visibility: 'hidden'
                }
            }
        },

        fileItemDetails: {
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 2,
            gap: theme.spacing(1),
            justifyContent: 'center',
            minWidth: 0
        },

        fileList: {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: theme.spacing(2),
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            marginBottom: theme.spacing(8),
            overflowY: 'auto',
            zIndex: 1
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
            textAlign: 'center',
        },

        hiddenInput: {
            visibility: 'hidden'
        },

        noFilesContainer: {
            display: 'flex',
            flexDirection: 'column',
            height: '88%',
            justifyContent: 'center',
            textAlign: 'center'
        },

        noFilesText: {
            ...withPixelLineHeight(theme.typography.bodyLongBold),
            color: theme.palette.text02,
            padding: '0 24px',
            textAlign: 'center'
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
        },

        uploadButton: {
            bottom: theme.spacing(4),
            cursor: 'pointer',
            left: '50%',
            position: 'absolute',
            transform: 'translateX(-50%)',
            width: '85%',
            zIndex: 1
        },

        uploadIcon: {
            margin: '0 auto'
        },

        actionIcon: {
            cursor: 'pointer',
            padding: theme.spacing(1),
            visibility: 'hidden'
        }
    };
});

const FileSharing = () => {
    const { classes } = useStyles();
    const [ isDragging, setIsDragging ] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const store = useStore();
    const { files } = useSelector((state: IReduxState) => state['features/file-sharing']);
    const sortedFiles = Array.from(files.values()).sort((a, b) => a.fileName.localeCompare(b.fileName));
    const isUploadEnabled = useSelector(isFileUploadingEnabled);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files as FileList, store);
            e.target.value = ''; // Reset the input value to allow re-uploading the same file
        }
    }, [ processFiles ]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files?.length > 0) {
            processFiles(e.dataTransfer.files as FileList, store);
        }
    }, [ processFiles ]);

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
        }
    }, []);

    return (
        <div className = { classes.container }>
            {
                isUploadEnabled && (
                    <>
                        <div
                            className = { `${classes.dropZone} ${
                                isDragging ? 'dragging' : ''
                            }` }
                            onDragEnter = { handleDragEnter }
                            onDragLeave = { handleDragLeave }
                            onDragOver = { handleDragOver }
                            onDrop = { handleDrop }
                            role = 'button'
                            tabIndex = { 0 }>
                            <input
                                className = { classes.hiddenInput }
                                multiple = { true }
                                onChange = { handleFileSelect }
                                ref = { fileInputRef }
                                type = 'file' />
                        </div>
                        {
                            sortedFiles.length === 0 && (
                                <div className = { classes.noFilesContainer }>
                                    <Icon
                                        className = { classes.uploadIcon }
                                        color = { BaseTheme.palette.icon03 }
                                        size = { 160 }
                                        src = { IconCloudUpload } />
                                    <span className = { classes.noFilesText }>
                                        { t('fileSharing.dragAndDrop') }
                                    </span>
                                </div>
                            )
                        }
                    </>
                )
            }
            {
                sortedFiles.length > 0 && (
                    <div className = { classes.fileList }>
                        {
                            sortedFiles.map(file => (
                                <div
                                    className = { classes.fileItem }
                                    key = { file.fileId }
                                    title = { file.fileName }>
                                    {
                                        (file.progress ?? 100) === 100 && (
                                            <>
                                                <div className = { classes.fileIconContainer }>
                                                    <Icon
                                                        color = { BaseTheme.palette.icon01 }
                                                        size = { 64 }
                                                        src = { getFileIcon(file.fileType) } />
                                                </div>
                                                <div className = { classes.fileItemDetails }>
                                                    <div className = { classes.fileName }>
                                                        { file.fileName }
                                                    </div>
                                                    <div className = { classes.fileSize }>
                                                        { formatFileSize(file.fileSize) }
                                                    </div>
                                                    <div className = { classes.fileAuthorParticipant }>
                                                        <Avatar
                                                            displayName = { file.authorParticipantName }
                                                            participantId = { file.authorParticipantId }
                                                            size = { 16 } />
                                                        <div className = { classes.fileAuthorParticipantName }>
                                                            { file.authorParticipantName }
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className = { `${classes.fileTimestamp} timestampVisibility` }>
                                                    <pre>
                                                        { formatTimestamp(file.timestamp) }
                                                    </pre>
                                                </div>
                                                <div className = { classes.buttonContainer }>
                                                    <Icon
                                                        className = { `${classes.actionIcon} actionIconVisibility` }
                                                        color = { BaseTheme.palette.icon01 }

                                                        // eslint-disable-next-line react/jsx-no-bind
                                                        onClick = { () => dispatch(downloadFile(file.fileId)) }
                                                        size = { 24 }
                                                        src = { IconDownload } />
                                                    {
                                                        isUploadEnabled && (
                                                            <Icon
                                                                className = { `${classes.actionIcon} actionIconVisibility` }
                                                                color = { BaseTheme.palette.icon01 }

                                                                // eslint-disable-next-line react/jsx-no-bind
                                                                onClick = { () => dispatch(removeFile(file.fileId)) }
                                                                size = { 24 }
                                                                src = { IconTrash } />
                                                        )
                                                    }
                                                </div>
                                            </>
                                        )
                                    }
                                    {
                                        (file.progress ?? 100) < 100 && (
                                            <div className = { classes.progressBar }>
                                                <div
                                                    className = { classes.progressFill }
                                                    style = {{ width: `${file.progress}%` }} />
                                            </div>
                                        )
                                    }
                                </div>
                            ))
                        }
                    </div>
                )
            }
            {
                isUploadEnabled && (
                    <Button
                        accessibilityLabel = { t('fileSharing.uploadFile') }
                        className = { classes.uploadButton }
                        labelKey = { 'fileSharing.uploadFile' }
                        onClick = { handleClick }
                        onKeyPress = { handleKeyPress }
                        type = { BUTTON_TYPES.PRIMARY } />
                )
            }
        </div>
    );
};

export default FileSharing;
