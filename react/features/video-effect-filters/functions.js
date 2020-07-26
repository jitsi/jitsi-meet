import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

/**
* Returns promise that resolves with an instance of the video effect 
* filters. All effects (e.g. bunny ears) are available in this instance.
*/
export function getVideoEffectFiltersInstance(effect) {
    const ns = getJitsiMeetGlobalNS();
	
    if (ns.effects && ns.effects.getOrCreateVideoEffectFiltersInstance) {
		return ns.effects.getOrCreateVideoEffectFiltersInstance(effect);
    }

    return loadScript('libs/video-effect-filters.min.js').then(() => ns.effects.getOrCreateVideoEffectFiltersInstance(effect));;
}
