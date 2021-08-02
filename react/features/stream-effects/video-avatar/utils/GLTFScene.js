// @flow
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * A base class for loaded scenes GLTFScenes
 */
export default class GLTFScene extends THREE.Scene {
    _gltfLoader = new GLTFLoader();

    /**
     * Constructor.
     *
     * @param  {string} path - The path of the model.
     */
    constructor(path: string) {
        super();
        this._gltfLoader.load(path,
        gltf => {
            this.add(gltf.scene);
            console.log(gltf.scene);
        });
    }

    /**
     * Rotates the scene.
     *
     * @param  {number} x - Degrees on x axis.
     * @param  {number} y - Degrees on y axis.
     * @param  {number} z - Degrees on z axis.
     * @returns {void}
     */
    rotate(x: number, y: number, z: number): void {
        this.rotateX(x);
        this.rotateY(-y);
        this.rotateZ(-z);
    }

    /**
     * Moves the scene.
     *
     * @param  {number} x - Move on x axis.
     * @param  {number} y - Move on y axis.
     * @param  {number} z - Move on z axis.
     * @returns {void}
     */
    move(x: number, y: number, z: number): void {
        this.position.x += x;
        this.position.y -= y;
        this.position.z += z;
    }


}
