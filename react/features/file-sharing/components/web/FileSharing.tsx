import React, { useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconCloudUpload, IconDownload, IconTrash } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import Icon from '../../../base/icons/components/Icon';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import BaseTheme from '../../../base/ui/components/BaseTheme.web';
import { downloadFile, removeFile, uploadFiles } from '../../actions';
import { formatFileSize, formatTimestamp, getFileIcon } from '../../functions.any';

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
            height: '100%',
            margin: '0 auto',
            maxWidth: '600px',
            padding: theme.spacing(3),
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
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
            transition: 'opacity 0.15s ease-in-out',
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
            flexDirection: 'column',
            gap: theme.spacing(2),
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            zIndex: 1,
            overflowY: 'auto',
            flex: 1,
            marginBottom: theme.spacing(8)
        },

        fileName: {
            ...theme.typography.labelBold,
            gap: theme.spacing(1),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },

        fileSize: {
            ...theme.typography.labelRegular
        },

        fileTimestamp: {
            ...theme.typography.labelRegular,
            alignItems: 'center',
            display: 'flex',
            textAlign: 'center'
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
            height: '4px',
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
    const { files } = useSelector((state: IReduxState) => state['features/file-sharing']);
    const isModerator = useSelector(isLocalParticipantModerator);

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

    const processFiles = useCallback((fileList: FileList | File[]) => {
        const newFiles = Array.from(fileList);

        dispatch(uploadFiles(newFiles));
    }, [ dispatch ]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
        }
    }, [ processFiles ]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
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
                isModerator && (
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
                        { files.size === 0 && (
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
                        ) }
                    </>
                )
            }
            { files.size > 0 && (
                <div className = { classes.fileList }>
                    { Array.from(files.entries()).map(([ fileId, file ]) => (
                        <div
                            className = { classes.fileItem }
                            key = { fileId }
                            title = { file.fileName }>
                            { (file.progress ?? 100) === 100 && (
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
                                        { isModerator && (
                                            <Icon
                                                className = { `${classes.actionIcon} actionIconVisibility` }
                                                color = { BaseTheme.palette.icon01 }

                                                // eslint-disable-next-line react/jsx-no-bind
                                                onClick = { () => dispatch(removeFile(file.fileId)) }
                                                size = { 24 }
                                                src = { IconTrash } />
                                        ) }
                                    </div>
                                </>
                            ) }
                            { (file.progress ?? 100) < 100 && (
                                <div className = { classes.progressBar }>
                                    <div
                                        className = { classes.progressFill }
                                        style = {{ width: `${file.progress}%` }} />
                                </div>
                            ) }
                        </div>
                    )) }
                </div>
            )}
            {
                isModerator && (
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
