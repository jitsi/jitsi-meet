import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { closeSecondaryWindow, setSecondaryLayout } from '../actions';
import { SECONDARY_LAYOUTS } from '../constants';
import { getSecondaryLayout } from '../functions';

/**
 * Toolbar displayed inside the secondary browser window.
 *
 * The two layout buttons form a WAI-ARIA radiogroup: only the selected one is
 * in the tab order (roving tabindex) and the arrow/Home/End keys move the
 * selection between them. The close button sits outside the group. All state
 * changes go through the shared Redux store.
 *
 * @returns {React.ReactElement}
 */
const SecondaryToolbar: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const currentLayout = useSelector(
        (state: IReduxState) => getSecondaryLayout(state)
    );
    const activeSpeakerRef = useRef<HTMLButtonElement>(null);
    const galleryRef = useRef<HTMLButtonElement>(null);

    const isActiveSpeaker = currentLayout === SECONDARY_LAYOUTS.ACTIVE_SPEAKER;
    const isGallery = currentLayout === SECONDARY_LAYOUTS.GALLERY;

    /**
     * Handles switching to active speaker layout.
     *
     * @returns {void}
     */
    const onActiveSpeaker = useCallback(() => {
        dispatch(setSecondaryLayout(SECONDARY_LAYOUTS.ACTIVE_SPEAKER));
    }, [ dispatch ]);

    /**
     * Handles switching to gallery layout.
     *
     * @returns {void}
     */
    const onGallery = useCallback(() => {
        dispatch(setSecondaryLayout(SECONDARY_LAYOUTS.GALLERY));
    }, [ dispatch ]);

    /**
     * Handles closing the secondary window.
     *
     * @returns {void}
     */
    const onClose = useCallback(() => {
        dispatch(closeSecondaryWindow());
    }, [ dispatch ]);

    /**
     * Moves the radiogroup selection with the keyboard, following the WAI-ARIA
     * radio pattern: arrows toggle between the two options, Home selects the
     * first and End the last.
     *
     * @param {React.KeyboardEvent} event - The keydown event.
     * @returns {void}
     */
    const onLayoutKeyDown = useCallback((event: React.KeyboardEvent) => {
        switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'ArrowRight':
        case 'ArrowDown':
            event.preventDefault();
            if (isActiveSpeaker) {
                onGallery();
                galleryRef.current?.focus();
            } else {
                onActiveSpeaker();
                activeSpeakerRef.current?.focus();
            }
            break;
        case 'Home':
            event.preventDefault();
            onActiveSpeaker();
            activeSpeakerRef.current?.focus();
            break;
        case 'End':
            event.preventDefault();
            onGallery();
            galleryRef.current?.focus();
            break;
        }
    }, [ isActiveSpeaker, onActiveSpeaker, onGallery ]);

    return (
        <div className = 'multi-screen-toolbar'>
            <div
                aria-label = { t('multiScreen.layoutLabel') }
                className = 'multi-screen-toolbar-buttons'
                onKeyDown = { onLayoutKeyDown }
                role = 'radiogroup'>
                <button
                    aria-checked = { isActiveSpeaker }
                    className = { `multi-screen-toolbar-btn ${isActiveSpeaker ? 'active' : ''}` }
                    id = 'multiScreenActiveSpeakerBtn'
                    onClick = { onActiveSpeaker }
                    ref = { activeSpeakerRef }
                    role = 'radio'
                    tabIndex = { isActiveSpeaker ? 0 : -1 }
                    type = 'button'>
                    { t('multiScreen.speakerView') }
                </button>
                <button
                    aria-checked = { isGallery }
                    className = { `multi-screen-toolbar-btn ${isGallery ? 'active' : ''}` }
                    id = 'multiScreenGalleryBtn'
                    onClick = { onGallery }
                    ref = { galleryRef }
                    role = 'radio'
                    tabIndex = { isGallery ? 0 : -1 }
                    type = 'button'>
                    { t('multiScreen.galleryView') }
                </button>
            </div>
            <button
                className = 'multi-screen-toolbar-btn multi-screen-close-btn'
                id = 'multiScreenCloseBtn'
                onClick = { onClose }
                type = 'button'>
                { t('multiScreen.close') }
            </button>
        </div>
    );
};

export default SecondaryToolbar;
