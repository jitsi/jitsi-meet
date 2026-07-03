import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { getStoredPiPWindow } from '../functions';
import logger from '../logger';

import PiPView from './PiPView';

/**
 * Component that manages Document Picture-in-Picture portal.
 * Uses createPortal to render PiP content into the separate PiP window.
 * The PiP window is opened via the action (button click), this just renders content.
 */
const PiPPortal: React.FC = () => {
    const [ container, setContainer ] = useState<HTMLElement | null>(null);

    const isDocPiPActive = useSelector((state: IReduxState) =>
        state['features/pip']?.isPiPActive ?? false
    );

    useEffect(() => {
        if (!isDocPiPActive) {
            setContainer(null);

            return;
        }

        const pipWindow = getStoredPiPWindow();

        if (pipWindow && !pipWindow.closed) {
            const existingContainer = pipWindow.document.getElementById('pip-root');

            if (existingContainer) {
                setContainer(existingContainer);
            } else {
                logger.log('Container NOT found in PiP window!');
            }
        } else {
            logger.log('No stored PiP window or window closed');
        }
    }, [ isDocPiPActive ]);

    if (!isDocPiPActive || !container) {
        return null;
    }

    return createPortal(
        <PiPView />,
        container
    );
};

export default PiPPortal;
