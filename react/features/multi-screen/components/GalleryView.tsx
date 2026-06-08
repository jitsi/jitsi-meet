import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getGalleryGridDimensions } from '../functions';

import GalleryTile from './GalleryTile';

/**
 * Maximum number of columns in the gallery grid.
 */
const MAX_GALLERY_COLUMNS = 5;

/**
 * Gap between gallery tiles in pixels.
 */
const GALLERY_GAP = 4;

interface IProps {

    /**
     * The participant currently shown with the dominant-speaker ring, if any.
     */
    dominantSpeakerId: string | null;

    /**
     * Ordered participant IDs to render as tiles (local first, then remotes).
     */
    participantIds: string[];
}

/**
 * Gallery layout for the secondary window: every participant in a responsive
 * grid sized to the container.
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
const GalleryView: React.FC<IProps> = ({ dominantSpeakerId, participantIds }) => {
    const { t } = useTranslation();

    // Container dimensions, tracked via a ResizeObserver bound through a callback
    // ref. The callback (re)attaches the observer whenever the grid mounts —
    // including when participants arrive after the window opened empty — and
    // tears it down when the grid unmounts (React calls it with null), so
    // nothing lingers on a detached node.
    //
    // The grid lives in the SECONDARY window's document while this React code
    // runs in the main window's realm, so the observer, rAF and resize listener
    // are all taken from that owner window. Otherwise the main window's
    // ResizeObserver never sees the popup's own layout changes — most visibly
    // browser page-zoom, which reflows only the popup and would otherwise leave
    // the tiles sized for the zoom level the window first opened at.
    const [ dimensions, setDimensions ] = useState<{ height: number; width: number; } | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const attachGridRef = useCallback((element: HTMLDivElement | null) => {
        cleanupRef.current?.();
        cleanupRef.current = null;

        if (!element) {
            return;
        }

        const ownerWindow = element.ownerDocument.defaultView ?? window;
        const ResizeObserverCtor = ownerWindow.ResizeObserver ?? ResizeObserver;
        let frame = 0;

        const measure = () => {
            const width = element.clientWidth;
            const height = element.clientHeight;

            // Bail out when the size is unchanged so a no-op measurement never
            // triggers a re-render (which would re-enter the observer).
            setDimensions(prev =>
                (prev && prev.width === width && prev.height === height)
                    ? prev
                    : { height,
                        width });
        };

        // Defer the measurement out of the observer/resize callback: updating
        // state there resizes the tiles synchronously, which is what raises the
        // benign "ResizeObserver loop … undelivered notifications" overlay error.
        const schedule = () => {
            ownerWindow.cancelAnimationFrame(frame);
            frame = ownerWindow.requestAnimationFrame(measure);
        };

        const observer = new ResizeObserverCtor(schedule);

        observer.observe(element);

        // Page-zoom fires resize on the popup window but does not always reach a
        // cross-document ResizeObserver, so re-measure on it explicitly too.
        ownerWindow.addEventListener('resize', schedule);

        cleanupRef.current = () => {
            ownerWindow.cancelAnimationFrame(frame);
            ownerWindow.removeEventListener('resize', schedule);
            observer.disconnect();
        };

        measure();
    }, []);

    const count = participantIds.length;

    if (count === 0) {
        return (
            <div className = 'multi-screen-gallery-placeholder'>
                <div className = 'multi-screen-gallery-message'>
                    { t('multiScreen.noParticipants') }
                </div>
            </div>
        );
    }

    // The grid is always rendered so attachGridRef can measure it; the tiles
    // themselves wait until the first measurement lands, avoiding a frame of
    // mis-sized tiles from a guessed default size.
    let tiles: React.ReactNode = null;

    if (dimensions) {
        const { columns, rows } = getGalleryGridDimensions(count, MAX_GALLERY_COLUMNS);

        // Calculate tile dimensions based on the gallery container size.
        const availableWidth = dimensions.width - ((columns - 1) * GALLERY_GAP) - 16;
        const availableHeight = dimensions.height - ((rows - 1) * GALLERY_GAP) - 16;
        const tileWidth = Math.floor(availableWidth / columns);
        const tileHeight = Math.floor(availableHeight / rows);

        // Build rows of participant IDs.
        const galleryRows: string[][] = [];

        for (let i = 0; i < count; i += columns) {
            galleryRows.push(participantIds.slice(i, i + columns));
        }

        tiles = galleryRows.map((row, rowIndex) => (
            <div
                className = 'multi-screen-gallery-row'
                key = { `row-${rowIndex}` }>
                { row.map(id => (
                    <GalleryTile
                        height = { tileHeight }
                        isActiveSpeaker = { id === dominantSpeakerId }
                        key = { id }
                        participantId = { id }
                        width = { tileWidth } />
                )) }
            </div>
        ));
    }

    return (
        <div
            className = 'multi-screen-gallery'
            ref = { attachGridRef }>
            { tiles }
        </div>
    );
};

export default GalleryView;
