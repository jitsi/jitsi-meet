// @flow

import GLTFScene from '../GLTFScene';

/**
 * Represents a 3d model of picture.
 */
export default class Helmet extends GLTFScene {
    /**
     * Constructs a helmet object.
     *
     * @param  {string} path - The path to the gltf file.
     */
    constructor() {
        super('images/DamagedHelmet/glTF/DamagedHelmet.gltf');
        this.scale.set(300, 300, 300);
    }
}
