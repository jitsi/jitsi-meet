import React, { useCallback, useState, useRef, ReactNode } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from 'react-i18next';
import { IconCloudUpload, IconDownload, IconTrash } from '../../base/icons/svg';
import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.web';
import { useDispatch, useSelector } from 'react-redux';
import { IReduxState } from '../../app/types';
import Icon from '../../base/icons/components/Icon';
import BaseTheme from '../../base/ui/components/BaseTheme.web';
import { addFiles, removeFile, downloadFile } from '../actions';
import logger from '../logger';
import { createFilePreview, getFileIcon } from '../functions.any';
import { isLocalParticipantModerator } from '../../base/participants/functions';
import { withPixelLineHeight } from '../../base/styles/functions.web';

const useStyles = makeStyles()(theme => {
    return {
        buttonContainer: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            gap: theme.spacing(2)
        },

        container: {
            boxSizing: 'border-box',
            height: '100%',
            margin: '0 auto',
            maxWidth: '600px',
            padding: theme.spacing(3),
            position: 'relative',
            width: '100%'
        },

        downloadButton: {
            marginRight: theme.spacing(1)
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
                opacity: 0.8
            }
        },

        fileIconContainer: {
            alignItems: 'center',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            width: '100%'
        },

        fileItem: {
            backgroundColor: theme.palette.ui02,
            borderRadius: theme.shape.borderRadius,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(1),
            marginBottom: theme.spacing(3),
            padding: theme.spacing(3),

            '&:hover': {
                backgroundColor: theme.palette.ui03,
                borderRadius: theme.shape.borderRadius,

                '& .actionIconVisibility': {
                    visibility: 'visible'
                }
            }
        },

        fileList: {
            gap: theme.spacing(2),
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            position: 'relative',
            zIndex: 1
        },

        fileName: {
            ...theme.typography.labelBold,
            gap: theme.spacing(1)
        },

        fileSize: {
            ...theme.typography.labelRegular
        },

        filePreview: {
            backgroundColor: theme.palette.ui03,
            borderRadius: theme.shape.borderRadius,
            height: '104px',
            objectFit: 'cover',
            width: '100%'
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

        removeButton: {
            alignItems: 'center',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center'
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

    const renderFilePreview = (file: File): ReactNode => (
        <div className = { classes.fileIconContainer }>
            <Icon
                color = { BaseTheme.palette.icon01 }
                size = { 24 }
                src = { getFileIcon(file) } />
        </div>
    );

    const processFiles = useCallback(async (fileList: FileList | File[]) => {
        try {
            const newFiles = await Promise.all(Array.from(fileList).map(async file => ({
                file,
                id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36),
                preview: await createFilePreview(file),
                progress: 0
            })));

            dispatch(addFiles(newFiles));
        } catch (error) {
            logger.error('Error processing files:', error);
        }
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
                        { files.length === 0 && (
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
            { files.length > 0 && (
                <div className = { classes.fileList }>
                    { files.map(file => (
                        <div
                            className = { classes.fileItem }
                            key = { file.id }>
                            { file.progress === 100 && (
                                <>
                                    <div className = { classes.fileIconContainer }>
                                        {file.file.type.startsWith('image/') ? (
                                            <img
                                                alt = { file.file.name }
                                                className = { classes.filePreview }
                                                src = { file.preview } />
                                        ) : (
                                            renderFilePreview(file.file)
                                        )}
                                    </div>
                                    <span className = { classes.fileName }>
                                        { file.file.name }
                                    </span>
                                    <span className = { classes.fileSize }>
                                        { file.file.size } KB
                                    </span>
                                    <div className = { classes.buttonContainer }>
                                        <Icon
                                            className = { `${classes.actionIcon} actionIconVisibility` }
                                            color = { BaseTheme.palette.icon01 }

                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => dispatch(downloadFile(file.id, file.file.name, file.md5)) }
                                            size = { 24 }
                                            src = { IconDownload } />
                                        { isModerator && (
                                            <Icon
                                                className = { `${classes.actionIcon} actionIconVisibility` }
                                                color = { BaseTheme.palette.icon01 }

                                                // eslint-disable-next-line react/jsx-no-bind
                                                onClick = { () => dispatch(removeFile(file.id)) }
                                                size = { 24 }
                                                src = { IconTrash } />
                                        ) }
                                    </div>
                                </>
                            ) }
                            { file.progress < 100 && (
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
            <Button
                accessibilityLabel = { t('fileSharing.uploadFile') }
                className = { classes.uploadButton }
                labelKey = { 'fileSharing.uploadFile' }
                onClick = { handleClick }
                onKeyPress = { handleKeyPress }
                type = { BUTTON_TYPES.PRIMARY } />
        </div>
    );
};

export default FileSharing;
