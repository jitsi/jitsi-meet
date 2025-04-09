import React, { useCallback, useState, useRef } from 'react';
import { makeStyles } from 'tss-react/mui';
import { WithTranslation } from 'react-i18next';
import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconCloudUpload, IconCloseLarge } from '../../base/icons/svg';
import { withPixelLineHeight } from '../../base/styles/functions.web';

/**
 * Interface representing a file being uploaded.
 */
interface IFile {
    /** Error message if upload fails */
    error?: string;
    /** The actual File object */
    file: File;
    /** Unique identifier for the file */
    id: string;
    /** Preview URL for the file (for images) */
    preview: string;
    /** Upload progress percentage */
    progress: number;
}

/**
 * Props for the FileUpload component.
 */
interface IProps extends WithTranslation {
    /** The current meeting ID where the file is being uploaded */
    meetingId: string;

    /** Callback to handle file upload completion */
    onUploadComplete?: (files: IFile[]) => void;

    /** The current user ID who is uploading the file */
    userId: string;
}

/**
 * Styles for the FileUpload component.
 */
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
            ...withPixelLineHeight(theme.typography.labelRegular)
        },

        fileItem: {
            backgroundColor: theme.palette.ui02,
            borderRadius: theme.shape.borderRadius,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(1),
            padding: theme.spacing(2),
            position: 'relative'
        },

        fileName: {
            color: theme.palette.text01,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...withPixelLineHeight(theme.typography.bodyShortRegular)
        },

        fileList: {
            display: 'grid',
            gap: theme.spacing(2),
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            marginTop: theme.spacing(3)
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
            height: theme.spacing(0.5),
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
            backgroundColor: theme.palette.ui04,
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            height: '8px',
            justifyContent: 'center',
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            transition: 'background-color 0.3s ease',
            width: '8px',

            '&:hover': {
                backgroundColor: theme.palette.ui03
            },

            '& svg': {
                fill: theme.palette.text01
            }
        },

        uploadButton: {
            alignItems: 'center',
            backgroundColor: theme.palette.action01,
            border: 'none',
            borderRadius: theme.shape.borderRadius,
            color: theme.palette.text04,
            cursor: 'pointer',
            display: 'flex',
            gap: theme.spacing(2),
            justifyContent: 'center',
            margin: '0 auto',
            padding: `${theme.spacing(1)} ${theme.spacing(3)}`,
            transition: 'background-color 0.3s ease',
            ...withPixelLineHeight(theme.typography.labelBold),

            '&:hover': {
                backgroundColor: theme.palette.action01Hover
            },

            '&:focus': {
                boxShadow: `0 0 0 2px ${theme.palette.focus01}`,
                outline: 'none'
            }
        }
    };
});

/**
 * A component that allows users to upload files during a meeting.
 * Supports drag and drop, file preview, progress tracking, and error handling.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
const FileUpload: React.FC<IProps> = ({ t, meetingId, userId }) => {
    const { classes } = useStyles();
    const [ files, setFiles ] = useState<IFile[]>([]);
    const [ isDragging, setIsDragging ] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * Handles the drag enter event to show visual feedback.
     */
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    /**
     * Handles the drag leave event to remove visual feedback.
     */
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    /**
     * Handles the drag over event to allow dropping.
     */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    /**
     * Creates a preview URL for image files.
     *
     * @param {File} file - The file to create a preview for.
     * @returns {Promise<string>} A promise that resolves to the preview URL.
     */
    const createFilePreview = useCallback((file: File): Promise<string> => {
        return new Promise(resolve => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = e => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                resolve('');
            }
        });
    }, []);

    /**
     * Uploads a file to the server with its metadata.
     *
     * @param {IFile} file - The file object to upload.
     * @returns {Promise<any>} A promise that resolves to the upload response.
     */
    const uploadFile = useCallback(async (file: IFile) => {
        try {
            const formData = new FormData();

            formData.append('file', file.file);

            const metadata = {
                fileName: file.file.name,
                fileType: file.file.type,
                fileSize: file.file.size,
                meetingId,
                userId,
                timestamp: new Date().toISOString()
            };

            formData.append('metadata', JSON.stringify(metadata));

            const response = await fetch('https://api-vo-pilot.jitsi.net/vo-content-sharing-history/swagger-ui/index.html#/Document%20sharing%20history/saveDocument', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    }, [ meetingId, userId ]);

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

        newFiles.forEach(async file => {
            try {
                await uploadFile(file);

                setFiles(prev => prev.map(f =>
                    f.id === file.id
                        ? { ...f, progress: 100 }
                        : f
                ));
            } catch (error) {
                setFiles(prev => prev.map(f =>
                    f.id === file.id
                        ? { ...f, error: 'Upload failed' }
                        : f
                ));
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

        newFiles.forEach(async file => {
            try {
                await uploadFile(file);

                setFiles(prev => prev.map(f =>
                    f.id === file.id
                        ? { ...f, progress: 100 }
                        : f
                ));
            } catch (error) {
                setFiles(prev => prev.map(f =>
                    f.id === file.id
                        ? { ...f, error: 'Upload failed' }
                        : f
                ));
            }
        });
    }, [ createFilePreview, uploadFile ]);

    /**
     * Removes a file from the list.
     *
     * @param {string} fileId - The ID of the file to remove.
     */
    const removeFile = useCallback((fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    }, []);

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
        removeFile(fileId);
    }, [ removeFile ]);

    return (
        <div className = { classes.container }>
            <div
                className = { `${classes.dropZone} ${isDragging ? 'dragging' : ''}` }
                onClick = { handleClick }
                onDragEnter = { handleDragEnter }
                onDragLeave = { handleDragLeave }
                onDragOver = { handleDragOver }
                onDrop = { handleDrop }
                onKeyPress = { handleKeyPress }
                role = 'button'
                tabIndex = { 0 }>
                <input
                    multiple = { true }
                    onChange = { handleFileSelect }
                    ref = { fileInputRef }
                    style = {{ display: 'none' }}
                    type = 'file' />
                <button className = { classes.uploadButton }>
                    <Icon src = { IconCloudUpload } />
                    {t('fileSharing.uploadFiles')}
                </button>
                <p>{t('fileSharing.dragAndDrop')}</p>
            </div>

            {files.length > 0 && (
                <div className = { classes.fileList }>
                    {files.map(file => (
                        <div
                            className = { classes.fileItem }
                            key = { file.id }>
                            {file.preview && (
                                <img
                                    alt = { file.file.name }
                                    className = { classes.filePreview }
                                    src = { file.preview } />
                            )}
                            <span className = { classes.fileName }>{file.file.name}</span>
                            <div className = { classes.progressBar }>
                                <div
                                    className = { classes.progressFill }
                                    style = {{ width: `${file.progress}%` }} />
                            </div>
                            {file.error && (
                                <span className = { classes.error }>{file.error}</span>
                            )}
                            <button
                                aria-label = { t('fileSharing.removeFile') }
                                className = { classes.removeButton }
                                onClick = { handleRemoveFile(file.id) }>
                                <Icon
                                    size = { 16 }
                                    src = { IconCloseLarge } />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default translate(FileUpload);
