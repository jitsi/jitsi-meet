// @flow

import * as bodyPix from '@tensorflow-models/body-pix';

import JitsiStreamBlurEffect from './JitsiStreamBlurEffect';
import * as TfLite from '../../../../background-wasm/tflite/tflite'
console.log(TfLite, 'my tflite')
/**
 * Creates a new instance of JitsiStreamBlurEffect. This loads the bodyPix model that is used to
 * extract person segmentation.
 *
 * @returns {Promise<JitsiStreamBlurEffect>}
 */
export async function createBlurEffect() {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        throw new Error('JitsiStreamBlurEffect not supported!');
    }

    // An output stride of 16 and a multiplier of 0.5 are used for improved
    // performance on a larger range of CPUs.
    const tflite = await TfLite();

        console.log(tflite, 'tflite structure')
        const modelBufferOffset = tflite._getModelBufferMemoryOffset()
        const modelResponse = await fetch(
            `/libs/segm_full_v679.tflite`
          )

          console.log(modelResponse, 'model response')
          const model = await modelResponse.arrayBuffer()
    
        tflite.HEAPU8.set(new Uint8Array(model), modelBufferOffset)
        let myModel = tflite._loadModel(model.byteLength)
        console.log(myModel, 'print my model')
        tflite._loadModel(model.byteLength)
        console.log(tflite, 'tflite new structure')
        return new JitsiStreamBlurEffect(tflite);
 
}
