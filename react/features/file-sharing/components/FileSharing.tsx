import React, { useCallback, useState, useRef, ReactElement } from 'react';
import md5 from 'js-md5';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from 'react-i18next';
import { IconCloudUpload, IconShareDoc, IconVideo, IconVolumeUp, IconWarning } from '../../base/icons/svg';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { IFile } from '../types';
import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.web';
import { useSelector } from 'react-redux';
import { IReduxState } from '../../app/types';
import { getLocalParticipant, getRemoteParticipants } from '../../base/participants/functions';
import { getCurrentConference } from '../../base/conference/functions';
import { extractFqnFromPath } from '../../dynamic-branding/functions.any';
import Icon from '../../base/icons/components/Icon';
import BaseThemeWeb from '../../base/ui/components/BaseTheme.web';
import logger from '../logger';
import { parseJWTFromURLParams } from '../../base/jwt/functions';

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
    const [ files, setFiles ] = useState<IFile[]>([]);
    const [ isDragging, setIsDragging ] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();
    const conference = useSelector(getCurrentConference);
    const sessionId = conference?.getMeetingUniqueId();
    const localParticipant = useSelector(getLocalParticipant);
    const remoteParticipants = useSelector(getRemoteParticipants);
    const { connection, locationURL } = useSelector((state: IReduxState) => state['features/base/connection']);
    const jwt = parseJWTFromURLParams(locationURL);
    const meetingFqn = useSelector(extractFqnFromPath);

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

    /**
     * Creates a preview URL for files based on their type.
     *
     * @param {File} file - The file to create a preview for.
     * @returns {Promise<string>} A promise that resolves to the preview URL or icon identifier.
     */
    const createFilePreview = (file: File): Promise<string> => {
        if (file.type.startsWith('image/')) {
            return new Promise(resolve => {
                const reader = new FileReader();

                reader.onload = e => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });
        }

        const iconMap: Record<string, string> = {
            'application/pdf': 'pdf-icon',
            'audio': 'audio-icon',
            'video': 'video-icon',
            'spreadsheet': 'spreadsheet-icon',
            'presentation': 'presentation-icon',
            'zip': 'archive-icon',
            'compressed': 'archive-icon',
            'archive': 'archive-icon'
        };

        const iconType = Object.entries(iconMap).find(([ type ]) =>
            file.type.includes(type)
        )?.[1];

        return Promise.resolve(iconType || 'file-icon');
    };

    /**
     * Renders the appropriate preview or icon for a file.
     *
     * @param {IFile} file - The file to render a preview for.
     * @returns {ReactElement} The preview element.
     */
    const renderFilePreview = (file: IFile): ReactElement => {
        if (file.preview && file.preview.startsWith('data:')) {

            // For image files, render the actual image
            return (
                <img
                    alt = { file.file.name }
                    className = { classes.filePreview }
                    src = { file.preview } />
            );
        } else {

            // For other file types, render an appropriate icon
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

            const IconComponent = iconMap[file.preview] || IconWarning;

            return (
                <div className = { classes.fileIconContainer }>
                    <Icon
                        color = { BaseThemeWeb.palette.icon01 }
                        size = { 24 }
                        src = { IconComponent } />
                </div>
            );
        }
    };

    /**
     * Uploads a file to the server with its metadata.
     *
     * @param {IFile} file - The file object to upload.
     * @returns {Promise<any>} A promise that resolves to the upload response.
     */
    const uploadFile = async (file: IFile) => {
        const jid = connection?.getJid();
        const participants: Array<string | undefined> = [];

        participants.push(localParticipant?.id);
        remoteParticipants.forEach(p => participants.push(p.id));

        const headers = {
            'accept': '*/*',
            ...jwt && { 'Authorization': `Bearer ${jwt}` },
            'Content-Type': 'multipart/form-data',
        };

        console.log('Headers:', headers);
        console.log('Authorization header:', headers.Authorization);

        try {
            const formData = new FormData();

            const metadata = {
                sessionId,
                contentType: file.file.name.split('.').pop()?.toUpperCase(),
                meetingFqn,
                timestamp: Date.now(),
                authorParticipantJid: jid,
                participantsIds: participants.filter(Boolean)
            };

            // Append metadata and file to FormData with exact backend format
            formData.append('metadata', JSON.stringify(metadata));
            formData.append(`file=@${file.file.name};type=${file.file.type}`, file.file);

            const response = await fetch('https://api-vo-pilot.jitsi.net/vo-content-sharing-history/v1/documents', {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();

                throw new Error(`Upload failed with status: ${response.status}. Error: ${errorText}`);
            }

            // Update the file's progress to 100% on successful upload
            setFiles(prev => prev.map(f =>
                f.id === file.id
                    ? { ...f, progress: 100 }
                    : f
            ));

            return response.json();
        } catch (error) {
            logger.warn(`Could not upload file: ${error}`);

            // Update the file's error state on failed upload
            setFiles(prev => prev.map(f =>
                f.id === file.id
                    ? { ...f, error: 'Upload failed' }
                    : f
            ));
            throw error;
        }
    };

    /**
     * Handles the file drop event.
     *
     * @param {React.DragEvent} e - The drag event.
     */
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);

        const newFiles: IFile[] = await Promise.all(
            droppedFiles.map(async file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                preview: await createFilePreview(file),
                progress: 0
            }))
        );

        setFiles(prev => [ ...prev, ...newFiles ]);

        // Upload each file and handle progress/errors internally
        newFiles.forEach(async file => {
            try {
                await uploadFile(file);
            } catch (error) {
                // Error handling is done inside uploadFile
            }
        });
    }, [ createFilePreview, uploadFile ]);

    /**
     * Handles the file input change event.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
     */
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        const newFiles: IFile[] = await Promise.all(
            selectedFiles.map(async file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                preview: await createFilePreview(file),
                progress: 0
            }))
        );

        setFiles(prev => [ ...prev, ...newFiles ]);


        // Upload each file and handle progress/errors internally
        newFiles.forEach(async file => {
            try {
                await uploadFile(file);
            } catch (error) {
                // Error handling is done inside uploadFile
            }
        });
    }, [ createFilePreview, uploadFile ]);

    /**
     * Handles the click event on the drop zone.
     */
    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    /**
     * Handles keyboard events for accessibility.
     *
     * @param {React.KeyboardEvent} e - The keyboard event.
     */
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
        }
    }, []);

    /**
     * Creates a handler for removing a specific file.
     *
     * @param {string} fileId - The ID of the file to remove.
     * @returns {Function} A function that removes the file when called.
     */
    const handleRemoveFile = useCallback((fileId: string) => () => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    }, []);

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
                    labelKey = { 'fileSharing.uploadFiles' } />
                <p>{ t('fileSharing.dragAndDrop') }</p>
            </div>

            {files.length > 0 && (
                <div className = { classes.fileList }>
                    {
                        files.map(file => (
                            <div
                                className = { classes.fileItem }
                                key = { file.id }>
                                {
                                    renderFilePreview(file)
                                }
                                <span className = { classes.fileName }>
                                    { file.file.name }
                                </span>
                                <div className = { classes.progressBar }>
                                    <div
                                        className = { classes.progressFill }
                                        style = {{ width: `${file.progress}%` }} />
                                </div>
                                {
                                    file.error && (
                                        <span className = { classes.error }>
                                            { file.error }
                                        </span>
                                    )
                                }
                                <Button
                                    accessibilityLabel = { t('fileSharing.removeFile') }
                                    className = { classes.removeButton }
                                    label = { t('fileSharing.removeFile') }
                                    onClick = { handleRemoveFile(file.id) }
                                    type = { BUTTON_TYPES.DESTRUCTIVE } />
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default FileSharing;
