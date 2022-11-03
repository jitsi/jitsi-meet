/* eslint-disable lines-around-comment */
import { ExcalidrawApp } from '@jitsi/excalidraw';
import clsx from 'clsx';
import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

// @ts-expect-error
import Filmstrip from '../../../../../modules/UI/videolayout/Filmstrip';
import { IReduxState } from '../../../app/types';
import { getLocalParticipant } from '../../../base/participants/functions';
// @ts-ignore
import { getVerticalViewMaxWidth } from '../../../filmstrip/functions.web';
import { getToolboxHeight } from '../../../toolbox/functions.web';
// @ts-ignore
import { shouldDisplayTileView } from '../../../video-layout/functions.any';
import { WHITEBOARD_UI_OPTIONS } from '../../constants';
import {
    getCollabDetails,
    getCollabServerUrl,
    isWhiteboardOpen,
    isWhiteboardVisible
} from '../../functions';

/**
 * Space taken by meeting elements like the subject and the watermark.
 */
const HEIGHT_OFFSET = 80;

interface IDimensions {

    /* The height of the component. */
    height: string;

    /* The width of the component. */
    width: string;
}

/**
 * The Whiteboard component.
 *
 * @returns {JSX.Element} - The React component.
 */
const Whiteboard: () => JSX.Element = () => {
    const excalidrawRef = useRef<any>(null);
    const collabAPIRef = useRef<any>(null);

    const isOpen = useSelector(isWhiteboardOpen);
    const isVisible = useSelector(isWhiteboardVisible);
    const isInTileView = useSelector(shouldDisplayTileView);
    const { clientHeight, clientWidth } = useSelector((state: IReduxState) => state['features/base/responsive-ui']);
    const { visible: filmstripVisible, isResizing } = useSelector((state: IReduxState) => state['features/filmstrip']);
    const filmstripWidth: number = useSelector(getVerticalViewMaxWidth);
    const collabDetails = useSelector(getCollabDetails);
    const collabServerUrl = useSelector(getCollabServerUrl);
    const { defaultRemoteDisplayName } = useSelector((state: IReduxState) => state['features/base/config']);
    const localParticipantName = useSelector(getLocalParticipant)?.name || defaultRemoteDisplayName || 'Fellow Jitster';

    useEffect(() => {
        if (!collabAPIRef.current) {
            return;
        }

        collabAPIRef.current.setUsername(localParticipantName);
    }, [ localParticipantName ]);

    /**
    * Computes the width and the height of the component.
    *
    * @returns {IDimensions} - The dimensions of the component.
    */
    const getDimensions = (): IDimensions => {
        let width: number;
        let height: number;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            if (filmstripVisible) {
                width = clientWidth - filmstripWidth;
            } else {
                width = clientWidth;
            }
            height = clientHeight - getToolboxHeight();
        } else {
            if (filmstripVisible) {
                height = clientHeight - Filmstrip.getFilmstripHeight();
            } else {
                height = clientHeight;
            }
            width = clientWidth;
        }

        return {
            width: `${width}px`,
            height: `${height - HEIGHT_OFFSET}px`
        };
    };

    const getCollabAPI = useCallback(collabAPI => {
        if (collabAPIRef.current) {
            return;
        }
        collabAPIRef.current = collabAPI;
        collabAPIRef.current.setUsername(localParticipantName);
    }, [ localParticipantName ]);

    return (
        <div
            className = { clsx(
                isResizing && 'disable-pointer',
                'whiteboard-container'
            ) }
            style = {{
                ...getDimensions(),
                marginTop: `${HEIGHT_OFFSET}px`,
                display: `${isInTileView || !isVisible ? 'none' : 'block'}`
            }}>
            {
                isOpen && (
                    <div className = 'excalidraw-wrapper'>
                        <ExcalidrawApp
                            collabDetails = { collabDetails }
                            collabServerUrl = { collabServerUrl }
                            excalidraw = {{
                                isCollaborating: true,
                                // @ts-ignore
                                ref: excalidrawRef,
                                theme: 'light',
                                UIOptions: WHITEBOARD_UI_OPTIONS
                            }}
                            getCollabAPI = { getCollabAPI } />
                    </div>
                )
            }
        </div>
    );
};

export default Whiteboard;
