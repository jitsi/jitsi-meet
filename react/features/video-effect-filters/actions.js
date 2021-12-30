// @flow

import { getLocalVideoTrack } from '../../features/base/tracks';

import { 
	BLUR_ENABLED,
	BUNNY_EARS_ENABLED, 
	FRAMED_FACE_GREY_ENABLED,
	FRAMED_FACE_RED_ENABLED,
	FRAMED_FACE_YELLOW_ENABLED,
	VIDEO_EFFECT_FILTERS_DISABLED 
} from './actionTypes';

import { getVideoEffectFiltersInstance } from './functions';

import logger from './logger';

/** 
* Signals that the local participant switched the video effect filter or
* turned it off.
*/
export function setVideoEffectFilter(selectedVideoEffectFilter) {
    return function(dispatch: (Object) => Object, getState: () => any) {
	const state = getState();
	
	if (state['features/video-effect-filters'].currentVideoEffectFilter !== selectedVideoEffectFilter) {
	    const { jitsiTrack } = getLocalVideoTrack(state['features/base/tracks']);
	    
	    let actionToDispatch;
	    
	    switch(selectedVideoEffectFilter) {
			case BLUR_ENABLED:
				actionToDispatch = blurEnabled();
				break;
			case BUNNY_EARS_ENABLED:
				actionToDispatch = bunnyEarsEnabled();
				break;
			case FRAMED_FACE_GREY_ENABLED:
				actionToDispatch = framedFaceGreyEnabled();
				break;
			case FRAMED_FACE_RED_ENABLED:
				actionToDispatch = framedFaceRedEnabled();
				break;
			case FRAMED_FACE_YELLOW_ENABLED:
				actionToDispatch = framedFaceYellowEnabled();
				break;
			case VIDEO_EFFECT_FILTERS_DISABLED:
			default:
				actionToDispatch = videoEffectFiltersDisabled();
				jitsiTrack.setEffect(undefined)
					.then(
						dispatch(actionToDispatch)
					).catch(
						error => {
							logger.error('Disabling video effect fliters failed with error: ', error);
						}
					);
				return Promise.resolve();
		}
		
		// Switch effect 
		return getVideoEffectFiltersInstance(selectedVideoEffectFilter)
			.then(
				videoEffectFiltersInstance => jitsiTrack.setEffect(videoEffectFiltersInstance)
					.then(
						dispatch(actionToDispatch)
					)			
			).catch(
				error => {
					logger.error('Switching effect failed with error: ',error);
					dispatch(videoEffectFiltersDisabled());
				});
	}
	
	// The selected effect is already selected, resolve Promise
	return Promise.resolve();
    };
}

/**
* Action creator that signals that the local participant has enabled 
* the background blur video effect filter.
*/
function blurEnabled() {
    return {
	    type: BLUR_ENABLED
    };
}

/**
* Action creator that signals that the local participant has enabled 
* the bunny ears video effect filter.
*/
function bunnyEarsEnabled() {
    return {
	    type: BUNNY_EARS_ENABLED
    };
}

/**
* Action creator that signals that the local participant has 
* enabled the grey face-frame video effect filter.
*/
function framedFaceGreyEnabled() {
    return {
	    type: FRAMED_FACE_GREY_ENABLED
    };
}

/**
* Action creator that signals that the local participant has 
* enabled the red face-frame video effect filter.
*/
function framedFaceRedEnabled() {
    return {
	    type: FRAMED_FACE_RED_ENABLED
    };
}

/**
* Action creator that signals that the local participant has 
* enabled the yellow face-frame video effect filter.
*/
function framedFaceYellowEnabled() {
    return {
	    type: FRAMED_FACE_YELLOW_ENABLED
    };
}

/**
* Action creator that signals that the local participant has 
* disabled all video effect filters.
*/
function videoEffectFiltersDisabled() {
    return {
	    type: VIDEO_EFFECT_FILTERS_DISABLED
    };
}


