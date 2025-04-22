import React, { useCallback, useState, useRef, ReactElement } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from 'react-i18next';
import { IconCloudUpload, IconShareDoc, IconVideo, IconVolumeUp, IconWarning } from '../../base/icons/svg';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { IFile } from '../types';
import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.web';
import { useDispatch, useSelector } from 'react-redux';
import { IReduxState } from '../../app/types';
import Icon from '../../base/icons/components/Icon';
import BaseThemeWeb from '../../base/ui/components/BaseTheme.web';
import { addFiles, removeFile } from '../actions';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            boxSizing: 'border-box',
            margin: '0 auto',
            maxWidth: '600px',
            padding: theme.spacing(3),
            width: '100%'
        },

        dropZone: {
            backgroundColor: theme.palette.ui02,
            border: `2px dashed ${theme.palette.ui03}`,
            borderRadius: theme.shape.borderRadius,
            cursor: 'pointer',
            marginBottom: theme.spacing(3),
            padding: theme.spacing(4),
            textAlign: 'center',
            transition: 'all 0.3s ease',

            '&:hover, &.dragging': {
                backgroundColor: theme.palette.ui03,
                borderColor: theme.palette.action01
            }
        },

        error: {
            color: theme.palette.actionDanger,
            marginTop: theme.spacing(1),
            ...withPixelLineHeight(theme.typography.labelBold)
        },

        fileItem: {
            backgroundColor: theme.palette.ui02,
            borderRadius: theme.shape.borderRadius,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(1),
            padding: theme.spacing(3),
            position: 'relative',
            marginBottom: theme.spacing(3)
        },

        fileName: {
            color: theme.palette.text01,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...withPixelLineHeight(theme.typography.bodyShortRegular)
        },

        fileList: {
            gap: theme.spacing(2),
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        },

        filePreview: {
            backgroundColor: theme.palette.ui03,
            borderRadius: theme.shape.borderRadius,
            height: '104px',
            objectFit: 'cover',
            width: '100%'
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
            cursor: 'pointer',
            margin: '0 auto',

            '&:hover': {
                backgroundColor: theme.palette.action01Hover
            },

            '&:focus': {
                boxShadow: `0 0 0 2px ${theme.palette.focus01}`,
                outline: 'none'
            }
        },

        hiddenInput: {
            display: 'none'
        },

        fileIconContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%'
        }
    };
});

const FileSharing: React.FC<{}> = (): ReactElement => {
    const { classes } = useStyles();
    const [ isDragging, setIsDragging ] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { files } = useSelector((state: IReduxState) => state['features/file-sharing']);

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

    const renderFilePreview = (file: IFile): ReactElement => {
        if (file.preview?.startsWith('data:')) {
            return (
                <img
                    alt = { file.file.name }
                    className = { classes.filePreview }
                    src = { file.preview } />
            );
        }

        const iconMap = {
            'pdf-icon': IconShareDoc,
            'document-icon': IconShareDoc,
            'audio-icon': IconVolumeUp,
            'video-icon': IconVideo,
            'spreadsheet-icon': IconShareDoc,
            'presentation-icon': IconShareDoc,
            'archive-icon': IconShareDoc,
            'file-icon': IconShareDoc
        };

        const IconComponent = iconMap[file.preview as keyof typeof iconMap] || IconWarning;

        return (
            <>
                <Icon
                    color = { BaseThemeWeb.palette.icon01 }
                    size = { 24 }
                    src = { IconComponent } />
            </>
        );
    };

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                id: `${file.name}-${Date.now()}`,
                preview: '',
                progress: 0
            }));

            dispatch(addFiles(newFiles));
        }
    }, [ dispatch ]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const newFiles = Array.from(e.dataTransfer.files).map(file => ({
            file,
            id: `${file.name}-${Date.now()}`,
            preview: '',
            progress: 0
        }));

        dispatch(addFiles(newFiles));
    }, [ dispatch ]);

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
        }
    }, []);

    const handleRemoveFile = useCallback((fileId: string) => () => {
        dispatch(removeFile(fileId));
    }, [ dispatch ]);

    return (
        <div className = { classes.container }>
            <div
                className = { `${classes.dropZone} ${
                    isDragging ? 'dragging' : ''
                }` }
                onClick = { handleClick }
                onDragEnter = { handleDragEnter }
                onDragLeave = { handleDragLeave }
                onDragOver = { handleDragOver }
                onDrop = { handleDrop }
                onKeyPress = { handleKeyPress }
                role = 'button'
                tabIndex = { 0 }>
                <input
                    className = { classes.hiddenInput }
                    multiple = { true }
                    onChange = { handleFileSelect }
                    ref = { fileInputRef }
                    type = 'file' />
                <Button
                    className = { classes.uploadButton }
                    icon = { IconCloudUpload }
                    labelKey = { 'fileSharing.uploadFiles' }
                    type = { BUTTON_TYPES.PRIMARY } />
                <p>{ t('fileSharing.dragAndDrop') }</p>
            </div>

            { files.length > 0 && (
                <div className = { classes.fileList }>
                    { files.map(file => (
                        <div
                            className = { classes.fileItem }
                            key = { file.id }>
                            { file.progress === 100 && (
                                <>
                                    <div className = { classes.fileIconContainer }>
                                        { renderFilePreview(file) }
                                    </div>
                                    <span className = { classes.fileName }>
                                        { file.file.name }
                                    </span>
                                    <Button
                                        accessibilityLabel = { t('fileSharing.removeFile') }
                                        className = { classes.removeButton }
                                        labelKey = { 'fileSharing.removeFile' }
                                        onClick = { handleRemoveFile(file.id) }
                                        type = { BUTTON_TYPES.DESTRUCTIVE } />
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
            ) }
        </div>
    );
};

export default FileSharing;
