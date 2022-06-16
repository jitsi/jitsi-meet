import { DETECT_FACE, INIT_WORKER } from './constants';
import { FaceLandmarksHelper, HumanHelper }from './FaceLandmarksHelper';


let helper: FaceLandmarksHelper;

onmessage = async function(message: MessageEvent<any>) {
    switch (message.data.type) {
    case DETECT_FACE: {
        if (!helper || helper.getDetectionInProgress()) {
            return;
        }

        const detections = await helper.detect(message.data);

        if (detections && (detections.faceBox || detections.faceExpression || detections.faceCount)) {
            self.postMessage(detections);
        }

        break;
    }

    case INIT_WORKER: {
        helper = new HumanHelper(message.data);
        break;
    }
    }
};
