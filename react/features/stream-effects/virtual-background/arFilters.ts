import { IARFilterConfig } from './JitsiStreamAREffect';

export type ARFilterOption = IARFilterConfig & { src: string; };

export const AR_FILTERS: Array<ARFilterOption> = [
    // {
    //     tooltip: // tooltip
    //     id: // id for the model
    //     modelFile: // 3D model file, in location images/ar/models/ sample: 'glass.glb'
    //     anchorLandmark: // https://storage.googleapis.com/mediapipe-assets/documentation/mediapipe_face_landmark_fullsize.png
    //     scaleMultiplier: // multiplies scale
    //     depthOffset: // to move in z-axis, positive moves -z,
    //     src: // thumbnail file name with location, sample: 'images/ar/glass.png'
    //     verticalOffset: // To move vertically, Positive moves upward
    // }
];
