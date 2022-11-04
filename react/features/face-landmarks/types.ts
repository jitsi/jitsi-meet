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
    faceExpression?: string;
};
