// @flow
import * as THREE from 'three';

import GLTFScene from './GLTFScene';
import { TRIANGULATION } from './Triangulation';
import { uvs } from './frontProjectionUVMap';
import { positionBufferData } from './positionBufferData';

/**
 * Represents a 3d model of picture.
 */
export default class FacePaint {
    _camera: Object;
    _halfW: number;
    _halfH: number;
    _height: number;
    _width: number;
    _renderer: Object;
    _scene: Object;
    _geometry: Object;
    _textureLoader: Object;
    _textureFilePath: string;
    _material: Object;
    _mesh: Object;
    _background: Object;
    _backgroundGeometry: Object;
    _backgroundMaterial: Object;
    _backgroundMesh: Object;
    _avatarScene: GLTFScene;
    _prev: THREE.Vector3;
    _current: THREE.Vector3;
    _difference: THREE.Vector3;
    _differences: Array<number>;
    _prevArea: number;
    _currentArea: number;
    _prevVectors: Object;
    _currentVectors: Object;

    /**
     * To do.
     *
     * @param  {Object} canvas - To do.
     * @param  {GLTFScene} avatarScene - To do.
     * @param  {number} w - To do.
     * @param  {number} h - To do.
     */
    constructor(canvas: Object, avatarScene: GLTFScene, w: number, h: number) {
        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas });
        this._avatarScene = avatarScene;
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(w, h);
        this._halfW = w * 0.5;
        this._halfH = h * 0.5;
        this._height = h;
        this._width = w;
        this._setupScene();

    }

    /**
     * Returns the vertices of the eyes.
     */
    static get EYE_VERTICES() {
        return [

            // LEFT EYE
            133, 173, 157, 158,
            159, 160, 161, 246,
            33, 7, 163, 144,
            145, 153, 154, 155,

            // RIGHT EYE
            362, 398, 384, 385,
            386, 387, 388, 466,
            263, 249, 390, 373,
            374, 380, 381, 382
        ];
    }

    /**
     * Adds a new camera.
     *
     * @returns {void}
     */
    _addCamera() {
        // this._camera = new THREE.OrthographicCamera(
        //         this._halfW,
        //         -this._halfW,
        //         -this._halfH,
        //         this._halfH,
        //         1, 1000
        // );
        // this._camera.position.x = this._halfW;
        // this._camera.position.y = this._halfH;
        // this._camera.position.z = -600;
        // this._camera.lookAt(
        //         this._halfW,
        //         this._halfH,
        //         0
        // );
        // this._camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
        // this._camera.position.set(-1.8, 0.6, 2.7);

        this._camera = new THREE.PerspectiveCamera(45, this._width / this._height, 1, 9000);

        // this._camera.position.z = (this._height / 2) / Math.tan((Math.PI * 45) / 360);
        this._camera.position.z = 800;
        console.log('CAMERA', this._camera.position.z);
        this._camera.lookAt(new THREE.Vector3(0, 0, 0));
        this._prev = new THREE.Vector3();
        this._current = new THREE.Vector3();
        this._difference = new THREE.Vector3();
    }

    /**
     * To do.
     *
     * @param  {number} val - To do.
     */
    set blendMode(val: number) {
        this._renderer.domElement.style.mixBlendMode = val;
    }

    /**
     * To do.
     *
     * @returns {void}
     */
    _addLights() {
        const light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);

        this._scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

        directionalLight.position.set(0, 0, 900).normalize();
        this._scene.add(directionalLight);
    }

    /**
     * To do.
     *
     * @returns {void}
     */
    _addGeometry() {
        this._geometry = new THREE.BufferGeometry();

        // const EV = FacePaint.EYE_VERTICES;
        // for(let i = TRIANGULATION.length - 1; i > -1; i-=3) {
        //   const a = TRIANGULATION[i];
        //   const b = TRIANGULATION[i - 1];
        //   const c = TRIANGULATION[i - 2];
        //   if(EV.indexOf(a) !== -1 ||
        //      EV.indexOf(b) !== -1 ||
        //      EV.indexOf(c) !== -1) {
        //     TRIANGULATION.splice(i - 2, 3);
        //   }
        // }
        this._geometry.setIndex(TRIANGULATION);
        this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBufferData, 3));
        this._geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        this._geometry.computeVertexNormals();

        this._backgroundGeometry = new THREE.PlaneGeometry(this._halfW * 2, this._halfH * 2);

        // this._backgroundGeometry = new THREE.PlaneGeometry(this._width, this._height);
        this._backgroundGeometry = new THREE.BufferGeometry();

        const vertices = [
            0, 0, 200,
            0, this._halfH * 2, 200,
            this._halfW * 2, 0.0, 200,
            this._halfW * 2, 0.0, 200,
            0.0, this._halfH * 2, 200,
            this._halfW * 2, this._halfH * 2, 200
        ];

        // const newUvs = [
        //     0.0, this._halfH * 2,
        //     0.0, 0.0,
        //     this._halfW * 2, this._halfH * 2,
        //     0.0, 0.0,
        //     this._halfW * 2, 0.0,
        //     this._halfW * 2, this._halfH * 2
        // ];

        this._backgroundGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // const height = this._height;
        // const width = this._width - 550;
        // const vValue = 0;
        // let uValue = 0;

        // let widthAspectRatio = 0;

        // widthAspectRatio = (width * width) / height;
        // uValue = ((widthAspectRatio - width) / 2) / widthAspectRatio;

        // const background = [
        //     new THREE.Vector2(0 + uValue, 0 + vValue),
        //     new THREE.Vector2(1 - uValue, 0 + vValue),
        //     new THREE.Vector2(1 - uValue, 1 - vValue),
        //     new THREE.Vector2(0 + uValue, 1 - vValue)
        // ];


        // this._backgroundGeometry.faceVertexUvs[0] = [];
        // this._backgroundGeometry.faceVertexUvs[0][0] = [ background[3], background[0], background[2] ];
        // this._backgroundGeometry.faceVertexUvs[0][1] = [ background[0], background[1], background[2] ];

        // this._backgroundGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(background, 2));
    }

    /**
     * To do.
     *
     * @returns {void}
     */
    _addMaterial() {
        // this._textureLoader = new THREE.TextureLoader();

        this._material = new THREE.MeshNormalMaterial();

        // const texture = new THREE.VideoTexture(this._background);

        this._backgroundMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color('0xffffff')
        });

    }

    /**
     * To do.
     *
     * @returns {void}
     */
    _setupScene() {
        this._scene = new THREE.Scene();
        this._addCamera();
        this._addLights();
        this._addGeometry();
        this._addMaterial();
        this._mesh = new THREE.Mesh(this._geometry, this._material);

        this._mesh.rotation.x = 9.1;
        this._mesh.position.x -= 640;
        this._mesh.position.y += 360;
        this._mesh.position.z += 70;
        this._scene.add(this._avatarScene);

        // this._backgroundMesh = new THREE.Mesh(this._backgroundGeometry, this._backgroundMaterial);

        // this._scene.add(this._mesh);

        // this._scene.add(this._backgroundMesh);
    }

    /**
     * Gets the area of a triangle.
     *
     * @param  {number} pointIndex1 - First point index from positionBuffer.
     * @param  {number} pointIndex2 - Second point index from positionBuffer.
     * @param  {number} pointIndex3 - Third point index from positionBuffer.
     * @param  {Array<number>} positionBuffer - Buffer with all the points.
     * @returns {number}
     */
    _getTriangleAria(pointIndex1: number,
            pointIndex2: number,
            pointIndex3: number,
            positionBuffer: Array<number>): number {
        let point1 = positionBuffer.slice(3 * pointIndex1, (3 * pointIndex1) + 3);
        let point2 = positionBuffer.slice(3 * pointIndex2, (3 * pointIndex2) + 3);
        let point3 = positionBuffer.slice(3 * pointIndex3, (3 * pointIndex3) + 3);

        point1 = new THREE.Vector3(point1[0], point1[1], point1[2]);
        point2 = new THREE.Vector3(point2[0], point2[1], point2[2]);
        point3 = new THREE.Vector3(point3[0], point3[1], point3[2]);
        const triangle = new THREE.Triangle(point1, point2, point3);

        return triangle.getArea();
    }

    /**
     * Returns the vector between two given points.
     *
     * @param  {number} pointIndex1 - First point index from positionBuffer.
     * @param  {number} pointIndex2 - Second point index from positionBuffer.
     * @param  {Array<number>} positionBuffer - Buffer with all the points.
     * @returns {THREE.Vector3}
     */
    _getVectorFromTwoPoints(pointIndex1: number, pointIndex2: number, positionBuffer: Array<number>): THREE.Vector3 {
        let point1 = positionBuffer.slice(3 * pointIndex1, (3 * pointIndex1) + 3);
        let point2 = positionBuffer.slice(3 * pointIndex2, (3 * pointIndex2) + 3);

        point1 = new THREE.Vector3(point1[0], point1[1], point1[2]);
        point2 = new THREE.Vector3(point2[0], point2[1], point2[2]);

        return point1.sub(point2);
    }

    /**
     * To do.
     *
     * @param  {Array<number>} positionBuffer - To do.
     * @param {Object} background - To do.
     * @returns {void}
     */
    render(positionBuffer: Array<number>): void {
        // console.log('background', background);
        if (!this._prev) {
            this._prev.fromArray(positionBuffer.slice(3, 6));
        }
        if (!this._prevArea) {
            this._prevArea = this._getTriangleAria(4, 104, 333, positionBuffer);
        }
        if (!this._prevVectors) {
            this._prevVectors = { x: this._getVectorFromTwoPoints(152, 10, positionBuffer),
                y: this._getVectorFromTwoPoints(234, 454, positionBuffer) };
        }
        if (this._avatarScene) {

            this._current.fromArray(positionBuffer.slice(3, 6));
            this._difference.subVectors(this._current, this._prev);

            this._currentArea = this._getTriangleAria(4, 104, 333, positionBuffer);
            this._currentVectors = { x: this._getVectorFromTwoPoints(152, 10, positionBuffer),
                y: this._getVectorFromTwoPoints(234, 454, positionBuffer) };

            const quaternion = new THREE.Quaternion();
            const depthDiff = (this._currentArea - this._prevArea) / 100;

            const rotation = {
                x: 0,
                y: 0,
                z: 0
            };

            quaternion.setFromUnitVectors(this._prevVectors.x, this._currentVectors.x);
            rotation.x = quaternion.x;

            quaternion.setFromUnitVectors(this._prevVectors.y, this._currentVectors.y);
            rotation.y = quaternion.y;

            rotation.z = quaternion.z;
            this._avatarScene.rotate(rotation.x, rotation.y, rotation.z);

            if (this._prev.x !== 0 && this._prev.y !== 0) {
                this._avatarScene.move(this._difference.x, this._difference.y, depthDiff);
            }

            this._prev = this._current.clone();
            this._prevArea = this._currentArea;
            this._prevVectors = this._currentVectors;
        }
        this._renderer.render(this._scene, this._camera);

        // this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBuffer, 3));
        // this._geometry.attributes.position.needsUpdate = true;
    }

}
