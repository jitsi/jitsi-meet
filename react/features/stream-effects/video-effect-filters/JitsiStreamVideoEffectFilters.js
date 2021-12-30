// @flow

import * as StackBlur from 'stackblur-canvas';

import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';

import {
	BLUR_ENABLED,
	BUNNY_EARS_ENABLED, 
	FRAMED_FACE_GREY_ENABLED,
	FRAMED_FACE_RED_ENABLED,
	FRAMED_FACE_YELLOW_ENABLED,
	VIDEO_EFFECT_FILTERS_DISABLED 
} from '../../video-effect-filters/actionTypes';

/**
 * Represents a modified MediaStream that adds funny effect filters to 
 * the video. 
 * This class does the processing of the original video stream.
 */
export default class JitsiStreamVideoEffectFilters {
    _bpModel: Object;
    _inputVideoElement: HTMLVideoElement;
    _inputVideoCanvasElement: HTMLCanvasElement;
    _onMaskFrameTimer: Function;
    _maskFrameTimerWorker: Worker;
    _maskInProgress: boolean;
    _outputCanvasElement: HTMLCanvasElement;
    _outputCanvasElementContext : CanvasRenderingContext2D;
    _renderMask: Function;
    _segmentationData: Object;
    _selectedVideoEffectFilter: String;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;
    _segmentationWorker: Worker;
    _doSegmentation: Function;
    

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {BodyPix} bpModel - BodyPix model.
     */
    constructor(bpModel: Object, effect) {
        this._bpModel = bpModel;
        this._selectedVideoEffectFilter = effect;

        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);

        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElementContext = this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');
        this._inputVideoCanvasElement = document.createElement('canvas');
        this.setSelectedVideoEffectFilter.bind(this);
        
        // Video effect image to draw onto the real image
        this._effectImage = new Image();
        this.setSelectedVideoEffectFilter(effect);
        
    }

    /**
     * EventHandler onmessage for the maskFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
	_onMaskFrameTimer(response: Object) {
        if (response.data.id === TIMEOUT_TICK) {
			
			this._renderMask();
            
            if (!this._maskInProgress) {
				this._doSegmentation();
			}
        }
    }
    
    /**
     * Refreshes the segmentation data that it used to determine the 
     * correct position and size of the effect images.
     *
     * @private
     * @returns {void}
	 */
    async _doSegmentation() {
		this._maskInProgress = true;
		this._bpModel.segmentPerson(this._inputVideoElement, {
			internalResolution: 'low', // resized to 0.5 times of the original resolution before inference
			maxDetections: 1, // max. number of person poses to detect per image
			segmentationThreshold: 0.7, // represents probability that a pixel belongs to a person
			flipHorizontal: false,
			scoreThreshold: 0.2
		}).then(data => {
			this._segmentationData = data;
			setTimeout(() => {this._maskInProgress = false;}, 3); // let the cpu breathe for a moment
		});
            
	}

	/**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
	 */
	_renderMask() {
	
		const inputCanvasCtx = this._inputVideoCanvasElement.getContext('2d');

        inputCanvasCtx.drawImage(this._inputVideoElement, 0, 0);

        const currentFrame = inputCanvasCtx.getImageData(
            0,
            0,
            this._inputVideoCanvasElement.width,
            this._inputVideoCanvasElement.height
        );
		
		if (this._segmentationData) {
            
            if (this._selectedVideoEffectFilter == BLUR_ENABLED) {
				// blur effect
				
				const blurData = new ImageData(currentFrame.data.slice(), currentFrame.width, currentFrame.height);

				StackBlur.imageDataRGB(blurData, 0, 0, currentFrame.width, currentFrame.height, 12);

				for (let x = 0; x < this._outputCanvasElement.width; x++) {
					for (let y = 0; y < this._outputCanvasElement.height; y++) {
						const n = (y * this._outputCanvasElement.width) + x;

						if (this._segmentationData.data[n] === 0) {
							currentFrame.data[n * 4] = blurData.data[n * 4];
							currentFrame.data[(n * 4) + 1] = blurData.data[(n * 4) + 1];
							currentFrame.data[(n * 4) + 2] = blurData.data[(n * 4) + 2];
							currentFrame.data[(n * 4) + 3] = blurData.data[(n * 4) + 3];
						}
					}
				}
				
				this._outputCanvasElementContext.putImageData(currentFrame, 0, 0);
				
			} else {
				// Video-effect-filter (anything but blur effect)
				
				// First, draw raw input image on screen 
				this._outputCanvasElementContext.drawImage(this._inputVideoElement, 0, 0); 
				
				// Only add an effect if a face has been identified 
				if (this._segmentationData.allPoses[0]) {
					
					var xNose = this._segmentationData.allPoses[0].keypoints[0].position.x;
					var yNose = this._segmentationData.allPoses[0].keypoints[0].position.y;
					var yLeftEye = this._segmentationData.allPoses[0].keypoints[1].position.y;
					var yRightEye = this._segmentationData.allPoses[0].keypoints[2].position.y;
					var xLeftEar = this._segmentationData.allPoses[0].keypoints[3].position.x;
					var xRightEar = this._segmentationData.allPoses[0].keypoints[4].position.x;
					
					var yDiffNoseEye = yNose - (Math.min(yLeftEye, yRightEye));
					var xDiffEars = Math.abs(xRightEar - xLeftEar);
					
					var posY;
					var scale;
						
					switch (this._selectedVideoEffectFilter) {
						case BUNNY_EARS_ENABLED:
							scale = xDiffEars * 1.9 / this._effectImage.height;
							posY = yNose - this._effectImage.height * scale;
							posY = posY - 2.4 * yDiffNoseEye;
							break;
						case FRAMED_FACE_GREY_ENABLED:
						case FRAMED_FACE_RED_ENABLED:
						case FRAMED_FACE_YELLOW_ENABLED:
							scale = xDiffEars * 1.5 / this._effectImage.width;
							posY = yNose - this._effectImage.height / 2 * scale;
							posY = posY - 0.5 * yDiffNoseEye;
							break;
					}	
					
					var posX = xNose - (this._effectImage.width / 2) * scale; 
					 
					// Draw effect image onto the raw image
					this._outputCanvasElementContext.drawImage(this._effectImage, posX, posY, this._effectImage.width * scale, this._effectImage.height * scale);
				}
			}
            
        } else  {
			// This will be called only before the first segmentation has taken place
			this._outputCanvasElementContext.drawImage(this._inputVideoElement, 0, 0);
		}
        
        this._maskFrameTimerWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: 1000 / 30
        });

    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} - Returns true if this effect can run on the specified track
     * false otherwise.
     */
    isEnabled(jitsiLocalTrack: Object) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'camera';
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
	 */
    startEffect(stream: MediaStream) {
		this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'Video effect worker' });
        this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
        
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();

        this._outputCanvasElement.width = parseInt(width, 10);
        this._outputCanvasElement.height = parseInt(height, 10);
        this._inputVideoCanvasElement.width = parseInt(width, 10);
        this._inputVideoCanvasElement.height = parseInt(height, 10);
        
        this._inputVideoElement.width = parseInt(width, 10);
        this._inputVideoElement.height = parseInt(height, 10);
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = stream;
        this._inputVideoElement.onloadeddata = () => {
            this._maskFrameTimerWorker.postMessage({
                id: SET_TIMEOUT,
                timeMs: 1000 / 30
            });
        };

        return this._outputCanvasElement.captureStream(parseInt(frameRate, 10));
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
	stopEffect() {
		this._maskFrameTimerWorker.postMessage({
            id: CLEAR_TIMEOUT
        });

		this._maskFrameTimerWorker.terminate();
	}
	
	/**
	* Switches the effect of this instance.
	* 
	* @returns {void}
	*/ 
	setSelectedVideoEffectFilter(selectedVideoEffectFilter) {
		this._selectedVideoEffectFilter = selectedVideoEffectFilter;
		switch (this._selectedVideoEffectFilter) {
			case BUNNY_EARS_ENABLED:
				this._effectImage.src = 'images/bunny_ears.png';
				break;
			case FRAMED_FACE_GREY_ENABLED:
				this._effectImage.src = 'images/framed_face_effect_grey.png';
				break;
			case FRAMED_FACE_RED_ENABLED:
				this._effectImage.src = 'images/framed_face_effect_red.png';
				break;
			case FRAMED_FACE_YELLOW_ENABLED:
				this._effectImage.src = 'images/framed_face_effect_yellow.png';
				break;
			default:
				this._effectImage.src = undefined;
		}
	}
}
