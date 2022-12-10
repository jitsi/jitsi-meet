export type DetectInput = {

    // @ts-ignore
    image: ImageBitmap | ImageData;
    threshold: number;
};

export type FaceBox = {
    left: number;
    right: number;
    width?: number;
};

export type InitInput = {
    baseUrl: string;
    detectionTypes: string[];
};

export type DetectOutput = {
    faceBox?: FaceBox;
    faceCount: number;
    faceExpression?: FaceExpression;
};

export type FaceExpression = {
    expression: string;
    score: number;
};

export type FaceLandmarks = {

    // duration in milliseconds of the face landmarks
    duration: number;
    faceExpression: string;
    score?: number;

    // the start timestamp of the expression
    timestamp: number;
};
