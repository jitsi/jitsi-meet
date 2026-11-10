import { IARFilterConfig } from './JitsiStreamAREffect';

export type ARFilterOption = IARFilterConfig & { src: string; };

export const AR_FILTERS: Array<ARFilterOption> = [

    {
        id: 'modern-glass',
        tooltip: 'arFilters.modern-glass',
        modelFile: 'modern-glass.glb',
        anchorLandmark: 168,
        scaleMultiplier: 1.7,
        depthOffset: 4,
        verticalOffset: 0.24,
        src: 'images/ar/thumbnails/modern-glass.png'
    },
    {
        id: 'bunny-hat',
        tooltip: 'arFilters.bunny-hat',
        modelFile: 'bunny-hat.glb',
        anchorLandmark: 10,
        scaleMultiplier: 2.5,
        depthOffset: 0.3,
        verticalOffset: -1.5,
        src: 'images/ar/thumbnails/bunny-hat.png'
    },
    {
        id: 'beard',
        tooltip: 'arFilters.beard',
        modelFile: 'beard.glb',
        anchorLandmark: 17,
        scaleMultiplier: 1.0,
        depthOffset: 0.06,
        verticalOffset: -0.6,
        src: 'images/ar/thumbnails/beard.png'
    }
];
