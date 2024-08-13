import { HumanHelper, IFaceLandmarksHelper } from './FaceLandmarksHelper';
import { DETECT, INIT_WORKER } from './constants';

let helper: IFaceLandmarksHelper;

onmessage = async function({ data }: MessageEvent<any>) {
    switch (data.type) {
    case DETECT: {
        if (!helper || helper.getDetectionInProgress()) {
            return;
        }

        // detections include both face detections and hand detections
        const detections = await helper.detect(data);

        if (detections) {
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
