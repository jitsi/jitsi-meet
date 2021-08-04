// @flow

import GLTFScene from '../GLTFScene';

/**
 * Represents a 3d model of picture.
 */
export default class Zoprac extends GLTFScene {
    /**
     * Constructs a helmet object.
     *
     * @param  {string} path - The path to the gltf file.
     */
    constructor() {
        super('images/Zoprac/untitled.gltf');
        this.scale.set(4, 4, 4);
        this.position.y -= 100;
    }
}
