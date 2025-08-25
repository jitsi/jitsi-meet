import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import Icon from '../../../base/icons/components/Icon';
import { IconCloudUpload, IconDownload, IconTrash } from '../../../base/icons/svg';
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
            bottom: 0,
            display: 'flex',
            justifyContent: 'end',
            gap: theme.spacing(2),
            position: 'absolute',
            right: theme.spacing(3),
            top: 0
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
            listStyleType: 'none',
            marginBottom: theme.spacing(8),
            marginTop: 0,
            overflowY: 'auto',
            padding: 0,
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
            ...theme.typography.bodyLongBold,
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
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            padding: theme.spacing(1),
            visibility: 'hidden',
            '&:focus': {
                outline: `2px solid ${theme.palette.action01}`
            }
        },

        iconButton: {
            background: 'none',
            border: 'none',
            padding: 0,
            marginLeft: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            '&:focus-visible': {
                outline: `2px solid ${theme.palette.action01}`,
                borderRadius: '4px'
            }
        }
    };
});

const FileSharing = () => {
    const { classes } = useStyles();
    const [ isDragging, setIsDragging ] = useState(false);
    const [ isFocused, setIsFocused ] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadButtonRef = useRef<HTMLButtonElement>(null);
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
            uploadButtonRef.current?.focus();
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
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
        }
    }, []);

    /* eslint-disable react/jsx-no-bind */
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
                            onDrop = { handleDrop } />
                        {
                            sortedFiles.length === 0 && (
                                <div
                                    className = { classes.noFilesContainer }
                                    onClick = { handleClick }
                                    onKeyUp = { handleKeyPress }
                                    role = 'button'
                                    tabIndex = { 0 }>
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
                        <input
                            className = { classes.hiddenInput }
                            multiple = { true }
                            onChange = { handleFileSelect }
                            ref = { fileInputRef }
                            tabIndex = { -1 }
                            type = 'file' />
                    </>
                )
            }
            {
                sortedFiles.length > 0 && (
                    <ul className = { classes.fileList }>
                        {
                            sortedFiles.map(file => (
                                <li
                                    className = { `${classes.fileItem} ${isFocused ? 'focused' : ''}` }
                                    key = { file.fileId }
                                    // Only remove focus when leaving the whole fileItem, not just moving between its buttons
                                    onBlur = { e => !e.currentTarget.contains(e.relatedTarget as Node) && setIsFocused(false) }
                                    onFocus = { () => setIsFocused(true) }
                                    tabIndex = { -1 }
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
                                                <div className = { `${classes.buttonContainer} actionIconVisibility` }>
                                                    <button
                                                        aria-label = { `${t('fileSharing.downloadFile')} ${file.fileName}` }
                                                        className = { `${classes.iconButton}` }
                                                        onClick = { () => dispatch(downloadFile(file.fileId)) }
                                                        type = 'button'>
                                                        <Icon
                                                            color = { BaseTheme.palette.icon01 }
                                                            size = { 24 }
                                                            src = { IconDownload } />
                                                    </button>

                                                    {
                                                        isUploadEnabled && (
                                                            <button
                                                                aria-label = { `${t('fileSharing.removeFile')} ${file.fileName}` }
                                                                className = { `${classes.iconButton}` }
                                                                onClick = { () => dispatch(removeFile(file.fileId)) }
                                                                type = 'button'>
                                                                <Icon
                                                                    color = { BaseTheme.palette.icon01 }
                                                                    size = { 24 }
                                                                    src = { IconTrash } />
                                                            </button>
                                                        )
                                                    }
                                                </div>
                                            </>
                                        )
                                    }
                                    {
                                        (file.progress ?? 100) < 100 && (
                                            <>
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
                                            </>
                                        )
                                    }
                                </li>
                            ))
                        }
                    </ul>
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
                        ref = { uploadButtonRef }
                        type = { BUTTON_TYPES.PRIMARY } />
                )
            }
        </div>
    );
};

export default FileSharing;
