import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { getGalleryGridDimensions } from '../functions.web';
import { useDominantSpeakerId, useSecondScreenParticipantIds } from '../hooks.web';

import SecondScreenTile from './SecondScreenTile';

/**
 * The type of the React {@code Component} props of {@link SecondScreenGallery}.
 */
interface IProps {

    /**
     * The second-screen window, needed to render tracks in its own realm.
     */
    win: Window;
}

/**
 * Maximum number of columns in the gallery grid.
 */
const MAX_GALLERY_COLUMNS = 5;

/**
 * Gap between gallery tiles in pixels. Must match the {@code gap} in the styles,
 * or the tile-size math mis-counts the gaps and the grid overflows.
 */
const GALLERY_GAP = 8;

/**
 * The styles, injected into the second window via its own Emotion cache.
 */
const useStyles = makeStyles()(() => {
    return {
        gallery: {
            boxSizing: 'border-box',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: GALLERY_GAP,
            padding: GALLERY_GAP,
            backgroundColor: '#040404',
            overflow: 'hidden'
        },
        row: {
            display: 'flex',
            justifyContent: 'center',
            gap: GALLERY_GAP
        },
        placeholder: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#040404'
        },
        message: {
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.5)'
        }
    };
});

/**
 * The tile-grid (gallery) layout for a second-screen window: every participant in
 * a responsive grid sized to the window. Tiles use the realm-safe {@link
 * SecondScreenTile}; the grid is measured through the popup window's own
 * {@code ResizeObserver} so it reflows to that window (including page-zoom).
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement}
 */
const SecondScreenGallery = ({ win }: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const participantIds = useSecondScreenParticipantIds();
    const dominantSpeakerId = useDominantSpeakerId();

    // Container dimensions, tracked via a ResizeObserver bound through a callback
    // ref so it (re)attaches when the grid mounts (including when participants
    // arrive after the window opened) and tears down when it unmounts. The grid
    // lives in the SECONDARY window while this code runs in the main window's
    // realm, so the observer, rAF and resize listener are taken from that window;
    // otherwise the main window's observer never sees the popup's own reflows
    // (most visibly page-zoom).
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

            // Skip a no-op measurement so it never re-enters the observer.
            setDimensions(prev =>
                ((prev && prev.width === width && prev.height === height) ? prev : { height,
                    width }));
        };

        // Defer the measurement out of the observer/resize callback: updating
        // state there resizes the tiles synchronously, raising the benign
        // "ResizeObserver loop" overlay error.
        const schedule = () => {
            ownerWindow.cancelAnimationFrame(frame);
            frame = ownerWindow.requestAnimationFrame(measure);
        };

        const observer = new ResizeObserverCtor(schedule);

        observer.observe(element);

        // Page-zoom fires resize on the popup but does not always reach a
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

    // Defensive: the local participant is normally first in the list, so this is
    // only hit in transient pre-join/teardown states. It keeps the second screen
    // from flashing blank rather than being a common path.
    if (count === 0) {
        return (
            <div className = { classes.placeholder }>
                <div className = { classes.message }>
                    { t('multiScreen.noParticipants') }
                </div>
            </div>
        );
    }

    // The grid is always rendered so attachGridRef can measure it; the tiles wait
    // for the first measurement, avoiding a frame of mis-sized tiles.
    let tiles: React.ReactNode = null;

    if (dimensions) {
        const { columns, rows } = getGalleryGridDimensions(count, MAX_GALLERY_COLUMNS);

        // The container has GALLERY_GAP padding on every side, so subtract it twice
        // (derived from the constant, not hardcoded, so the two stay in sync). Clamp
        // so a very small window never yields a negative tile size.
        const availableWidth = dimensions.width - ((columns - 1) * GALLERY_GAP) - (2 * GALLERY_GAP);
        const availableHeight = dimensions.height - ((rows - 1) * GALLERY_GAP) - (2 * GALLERY_GAP);
        const tileWidth = Math.max(0, Math.floor(availableWidth / columns));
        const tileHeight = Math.max(0, Math.floor(availableHeight / rows));
        const galleryRows: string[][] = [];

        for (let i = 0; i < count; i += columns) {
            galleryRows.push(participantIds.slice(i, i + columns));
        }

        tiles = galleryRows.map((row, rowIndex) => (
            <div
                className = { classes.row }
                key = { `row-${rowIndex}` }>
                { row.map(pid => (
                    <SecondScreenTile
                        height = { tileHeight }
                        isActiveSpeaker = { pid === dominantSpeakerId }
                        key = { pid }
                        participantId = { pid }
                        width = { tileWidth }
                        win = { win } />
                )) }
            </div>
        ));
    }

    return (
        <div
            className = { classes.gallery }
            ref = { attachGridRef }>
            { tiles }
        </div>
    );
};

export default SecondScreenGallery;
