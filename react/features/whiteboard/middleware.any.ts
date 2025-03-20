import { ExcalidrawApp } from '@jitsi/excalidraw';
import { createOpenWhiteboardEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { COPY_IMAGE_TO_BOARD, SET_WHITEBOARD_OPEN } from './actionTypes';
import {
    notifyWhiteboardLimit,
    resetWhiteboard,
    restrictWhiteboard,
    setWhiteboardOpen,
    setupWhiteboard
} from './actions';
import { WHITEBOARD_ID } from './constants';
import {
    generateCollabServerUrl,
    isWhiteboardOpen,
    shouldEnforceUserLimit,
    shouldNotifyUserLimit
} from './functions';

MiddlewareRegistry.register((store: IStore) => next => action => {
    const state = store.getState();

    switch (action.type) {
    case SET_WHITEBOARD_OPEN: {
        const enforceUserLimit = shouldEnforceUserLimit(state);
        const notifyUserLimit = shouldNotifyUserLimit(state);

        if (action.isOpen && !enforceUserLimit && !notifyUserLimit) {
            sendAnalytics(createOpenWhiteboardEvent());

            return next(action);
        }

        break;
    }

    case UPDATE_CONFERENCE_METADATA: {
        const { metadata } = action;

        if (metadata?.[WHITEBOARD_ID]) {
            store.dispatch(setupWhiteboard({
                collabDetails: metadata[WHITEBOARD_ID].collabDetails,
                collabServerUrl: generateCollabServerUrl(store.getState())
            }));
            store.dispatch(setWhiteboardOpen(true));
        }

        break;
    }
    
    case COPY_IMAGE_TO_BOARD:{
        const {file,excalidrawRef,clientX,clientY} = action;

        if(file && file.type.startsWith("image/") && excalidrawRef.current){
            const reader = new FileReader()
            reader.onloadend = () =>{
                const fileId = `image-${Date.now()}`
                const imageType = file.type
                const dataURL = reader.result

                const imageElement = {
                    id: fileId,
                    fileId,
                    type: "image",
                    x: clientX,
                    y: clientY,
                    width: 500,
                    height: 300,
                    scale: [1, 1],
                    angle: 0,
                    strokeColor: "transparent",
                    backgroundColor: "transparent",
                    fillStyle: "hachure",
                    strokeWidth: 1,
                    strokeStyle: "solid",
                    roughness: 1,
                    opacity: 100,
                    groupIds: [],
                    status: "saved",
                    version: 1,
                    versionNonce: Date.now(),
                    isDeleted: false,
                    boundElements: null,
                    link: null,
                    updated: Date.now(),
                    isResizable: true,
                    isLocked: false,
                };
                let currentScene = excalidrawRef.current.getSceneElements();
                currentScene.push(imageElement)

                excalidrawRef.current.addFiles([{
                    id: fileId,
                    fileId: fileId,
                    dataURL: dataURL,
                    mimeType: imageType,
                    created: Date.now(),
                    lastRetrieved: Date.now()
                }]);

                excalidrawRef.current.updateScene({
                    elements: currentScene,
                    commitToHistory: true,
                });
                excalidrawRef.current.scrollToContent();
            }
            reader.readAsDataURL(file)
        }
    }
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Disable the whiteboard if it's left open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference): void => {
        if (conference !== previousConference) {
            dispatch(resetWhiteboard());
        }
    });

/**
 * Set up state change listener to limit whiteboard access.
 */
StateListenerRegistry.register(
    state => shouldEnforceUserLimit(state),
    (enforceUserLimit, { dispatch, getState }): void => {
        if (isWhiteboardOpen(getState()) && enforceUserLimit) {
            dispatch(restrictWhiteboard());
        }
    }
);

/**
 * Set up state change listener to notify about whiteboard usage.
 */
StateListenerRegistry.register(
    state => shouldNotifyUserLimit(state),
    (notifyUserLimit, { dispatch, getState }, prevNotifyUserLimit): void => {
        if (isWhiteboardOpen(getState()) && notifyUserLimit && !prevNotifyUserLimit) {
            dispatch(notifyWhiteboardLimit());
        }
    }
);
