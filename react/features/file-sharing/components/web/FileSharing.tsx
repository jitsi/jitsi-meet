import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconCloudUpload } from '../../../base/icons/svg';
import BaseTheme from '../../../base/ui/components/BaseTheme.web';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { downloadFile, removeFile } from '../../actions';
import {
    isFileUploadingEnabled,
    processFiles
} from '../../functions.any';

import FileItem from './FileItem';

const useStyles = makeStyles()(theme => {
    return {
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
            zIndex: 1,

            '& > li': {
                listStyleType: 'none',
                margin: 0,
                padding: 0
            }
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
        }
    };
});

const FileSharing = () => {
    const { classes } = useStyles();
    const [ isDragging, setIsDragging ] = useState(false);
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
                                <li key = { file.fileId }>
                                    <FileItem
                                        file = { file }
                                        onDownload = { fileId => dispatch(downloadFile(fileId)) }
                                        onRemove = { fileId => dispatch(removeFile(fileId)) }
                                        showRemoveButton = { isUploadEnabled } />
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
