import JitsiStreamVideoEffectFilters from './JitsiStreamVideoEffectFilters';
import * as bodyPix from '@tensorflow-models/body-pix';

var effectInstance;

/**
* Returns an instance of JitsiStreamVideoEffectFilters and loads the
* bodyPix model that is used for person segmentation.
*/
export async function getOrCreateVideoEffectFiltersInstance(effect) {
	if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
		throw new Error('JitsiStreamVideoEffectFilters not supported!');
	}
	
	if (effectInstance) {
		effectInstance.setSelectedVideoEffectFilter(effect);
	} else {
		
		// Output stride of 16 and a multiplier of 0.5 (same as blur effect suggests).
		const bpModel = await bodyPix.load({
			architecture: 'MobileNetV1',
			outputStride: 16,
			multiplier: 0.50,
			quantBytes: 2
		});

		effectInstance = new JitsiStreamVideoEffectFilters(bpModel, effect);		
	}
	
	return effectInstance;
}
