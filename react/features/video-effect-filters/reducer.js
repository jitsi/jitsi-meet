import { ReducerRegistry } from '../base/redux';

import { 
	BLUR_ENABLED,
	BUNNY_EARS_ENABLED, 
	FRAMED_FACE_GREY_ENABLED,
	FRAMED_FACE_RED_ENABLED,
	FRAMED_FACE_YELLOW_ENABLED,
	VIDEO_EFFECT_FILTERS_DISABLED 
} from './actionTypes';

ReducerRegistry.register('features/video-effect-filters', (state = {}, action) => {

    switch (action.type) {
	case BLUR_ENABLED: {
	return {
	    ...state,
	    currentVideoEffectFilter: BLUR_ENABLED
	};
    }
    case BUNNY_EARS_ENABLED: {
	return {
	    ...state,
	    currentVideoEffectFilter: BUNNY_EARS_ENABLED
	};
    }
    case FRAMED_FACE_GREY_ENABLED: {
	return {
	    ...state,
	    currentVideoEffectFilter: FRAMED_FACE_GREY_ENABLED
	};
    }
    case FRAMED_FACE_RED_ENABLED: {
	return {
	    ...state,
	    currentVideoEffectFilter: FRAMED_FACE_RED_ENABLED
	};
    }
    case FRAMED_FACE_YELLOW_ENABLED: {
	return {
	    ...state,
	    currentVideoEffectFilter: FRAMED_FACE_YELLOW_ENABLED
	};
    }
    case VIDEO_EFFECT_FILTERS_DISABLED: {
	return {
	    ...state,
	    currentVideoEffectFilter: VIDEO_EFFECT_FILTERS_DISABLED
	};
    }
    }

    return state;
});
