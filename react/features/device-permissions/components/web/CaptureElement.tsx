import React, { useEffect, useRef } from 'react';

import { CaptureKind, getCaptureElement } from '../../functions';
import logger from '../../logger';

interface IProps {

    /**
     * The devices to ask for.
     */
    kinds: CaptureKind[];

    /**
     * Invoked once the browser granted or denied access.
     */
    onDone: () => void;

    /**
     * Invoked when the element can't be used.
     */
    onUnsupported: () => void;
}

/**
 * Renders the browser's capability element for the devices ({@code <microphone>}, {@code <camera>} or
 * {@code <usermedia>}), which asks for access when the user clicks it, next to the element, and lets the user undo
 * an earlier block.
 *
 * @param {IProps} props - The component's props.
 * @returns {JSX.Element}
 */
const CaptureElement = ({ kinds, onDone, onUnsupported }: IProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tagName = getCaptureElement(kinds);

        if (!tagName) {
            onUnsupported();

            return;
        }

        const element: any = document.createElement(tagName);
        const isUserMedia = tagName === 'usermedia';

        if (isUserMedia) {
            try {
                element.setConstraints({
                    audio: {},
                    video: {}
                });
            } catch (error) {
                logger.warn('The usermedia element rejected the constraints', error);
                onUnsupported();

                return;
            }
        }

        // The media only shows that access was granted, the tracks are created as usual.
        const onMedia = () => {
            const tracks: MediaStreamTrack[] = isUserMedia ? element.stream?.getTracks() ?? [] : [ element.track ];

            tracks.forEach(track => track?.stop());
            onDone();
        };
        const mediaEvent = isUserMedia ? 'stream' : 'track';

        element.addEventListener(mediaEvent, onMedia);
        element.addEventListener('error', onDone);
        containerRef.current?.appendChild(element);

        return () => {
            element.removeEventListener(mediaEvent, onMedia);
            element.removeEventListener('error', onDone);
            element.remove();
        };
    }, []);

    return <div ref = { containerRef } />;
};

export default CaptureElement;
