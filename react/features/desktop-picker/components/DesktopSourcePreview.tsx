import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';


/**
 * The type of the React {@code Component} props of
 * {@link DesktopSourcePreview}.
 */
interface IProps {

    /**
     * The callback to invoke when the component is clicked. The id of the
     * clicked on DesktopCapturerSource will be passed in.
     */
    onClick: Function;

    /**
     * The callback to invoke when the component is double clicked. The id of
     * the DesktopCapturerSource will be passed in.
     */
    onDoubleClick: Function;

    /**
     * The indicator which determines whether this DesktopSourcePreview is
     * selected. If true, the 'is-selected' CSS class will be added to the root
     * of Component.
     */
    selected: boolean;

    /**
     * The DesktopCapturerSource to display.
     */
    source: any;

    /**
     * The source type of the DesktopCapturerSources to display.
     */
    type: string;
}

/**
 * React component for displaying a preview of a DesktopCapturerSource.
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement}
 */
const DesktopSourcePreview = ({
    onClick,
    onDoubleClick,
    selected,
    source,
    type
}: IProps) => {
    const { t } = useTranslation();

    const _onClick = useCallback(() => {
        onClick(source.id, type);
    }, [ onClick, source.id, type ]);

    const _onDoubleClick = useCallback(() => {
        onDoubleClick(source.id, type);
    }, [ onDoubleClick, source.id, type ]);

    const selectedClass = selected ? 'is-selected' : '';
    const displayClasses = `desktop-picker-source ${selectedClass}`;

    // default data URL for thumbnail image
    let srcImage = source.thumbnail.dataUrl;

    // legacy thumbnail image
    if (typeof source.thumbnail.toDataURL === 'function') {
        srcImage = source.thumbnail.toDataURL();
    }

    return (
        <div
            className = { displayClasses }
            onClick = { _onClick }
            onDoubleClick = { _onDoubleClick }>
            <div className = 'desktop-source-preview-image-container'>
                <img
                    alt = { t('welcomepage.logo.desktopPreviewThumbnail') }
                    className = 'desktop-source-preview-thumbnail'
                    src = { srcImage } />
            </div>
            <div className = 'desktop-source-preview-label'>
                { source.name }
            </div>
        </div>
    );
};

export default DesktopSourcePreview;
