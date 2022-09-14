import { FaceLandmarksHelper, HumanHelper } from './FaceLandmarksHelper';
import { DETECT_FACE, INIT_WORKER } from './constants';

let helper: FaceLandmarksHelper;

onmessage = async function({ data }: MessageEvent<any>) {
    switch (data.type) {
    case DETECT_FACE: {
        if (!helper || helper.getDetectionInProgress()) {
            return;
        }

        const detections = await helper.detect(data);

        if (detections && (detections.faceBox || detections.faceExpression || detections.faceCount)) {
            self.postMessage(detections);
        }

        break;
    }

    case INIT_WORKER: {
        helper = new HumanHelper(data);
        break;
    }
    }
};
