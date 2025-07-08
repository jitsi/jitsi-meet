import { IStore } from '../../app/types';
import { CONFERENCE_JOINED } from '../../base/conference/actionTypes';
import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';
import { getLocalAudioTrack, getLocalJitsiAudioTrack } from '../../base/tracks/functions.any';
import { UniversalTranslatorEffect } from '../../stream-effects/universal-translator';
import {
    DISABLE_UNIVERSAL_TRANSLATOR_EFFECT,
    ENABLE_UNIVERSAL_TRANSLATOR_EFFECT,
    START_TRANSLATION_RECORDING
} from '../actionTypes';
import {
    disableUniversalTranslatorEffect,
    enableUniversalTranslatorEffect
} from '../actions';

/**
 * Global reference to the Universal Translator effect instance.
 */
let universalTranslatorEffect: UniversalTranslatorEffect | null = null;

/**
 * Middleware to handle Universal Translator stream effect integration.
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: any) => {
    const { dispatch, getState } = store;

    switch (action.type) {
    case CONFERENCE_JOINED:
        // Initialize effect when conference is joined
        _initializeUniversalTranslatorEffect(store);
        break;

    case START_TRANSLATION_RECORDING:
        // Enable effect when translation starts
        if (!getState()['features/universal-translator']?.effectEnabled) {
            dispatch(enableUniversalTranslatorEffect());
        }
        break;

    case ENABLE_UNIVERSAL_TRANSLATOR_EFFECT:
        _enableEffect(store);
        break;

    case DISABLE_UNIVERSAL_TRANSLATOR_EFFECT:
        _disableEffect(store);
        break;
    }

    return next(action);
});

/**
 * Initialize the Universal Translator effect.
 */
async function _initializeUniversalTranslatorEffect(store: IStore) {
    const { getState } = store;

    try {
        // Create effect instance if it doesn't exist
        if (!universalTranslatorEffect) {
            universalTranslatorEffect = new UniversalTranslatorEffect();
            console.log('UniversalTranslatorEffect: Effect instance created');
        }
    } catch (error) {
        console.error('Failed to initialize Universal Translator effect:', error);
    }
}

/**
 * Enable the Universal Translator effect on the local audio track.
 */
async function _enableEffect(store: IStore) {
    const { getState } = store;

    if (!universalTranslatorEffect) {
        console.warn('Universal Translator effect not initialized');

        return;
    }

    try {
        const state = getState();
        const conference = state['features/base/conference'].conference;
        const localAudioTrack = getLocalJitsiAudioTrack(state);

        if (!conference || !localAudioTrack) {
            console.warn('Conference or local audio track not available');

            return;
        }

        // Apply the effect to the local audio track
        if (localAudioTrack && localAudioTrack.setEffect) {
            await localAudioTrack.setEffect(universalTranslatorEffect);
        } else {
            console.warn('Local audio track does not support effects');
            return;
        }

        console.log('UniversalTranslatorEffect: Effect enabled on local audio track');
    } catch (error) {
        console.error('Failed to enable Universal Translator effect:', error);
    }
}

/**
 * Disable the Universal Translator effect on the local audio track.
 */
async function _disableEffect(store: IStore) {
    const { getState } = store;

    if (!universalTranslatorEffect) {
        return;
    }

    try {
        const state = getState();
        const localAudioTrack = getLocalJitsiAudioTrack(state);

        if (localAudioTrack && localAudioTrack.setEffect) {
            // Remove the effect from the local audio track
            await localAudioTrack.setEffect(undefined);
        }

        console.log('UniversalTranslatorEffect: Effect disabled on local audio track');
    } catch (error) {
        console.error('Failed to disable Universal Translator effect:', error);
    }
}

/**
 * Get the Universal Translator effect instance.
 * This is used by the translation middleware to send translated audio to the effect.
 */
export function getUniversalTranslatorEffect(): UniversalTranslatorEffect | null {
    return universalTranslatorEffect;
}
