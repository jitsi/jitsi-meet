// @flow
import * as THREE from 'three';

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
    _controls: Object;

    /**
     * To do.
     *
     * @param  {Object} canvas - To do.
     * @param  {Object} background - To do.
     * @param  {number} w - To do.
     * @param  {number} h - To do.
     */
    constructor(canvas: Object, background: Object, w: number, h: number) {
        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas });
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(w, h);
        this._halfW = w * 0.5;
        this._halfH = h * 0.5;
        this._height = h;
        this._width = w;
        this._background = background;
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
        this._camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 9000);
        this._camera.position.z = (window.innerHeight / 2) / Math.tan((Math.PI * 45) / 360);
        this._camera.lookAt(new THREE.Vector3(0, 0, 0));
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

        directionalLight.position.set(this._halfW, this._halfH * 0.5, -1000).normalize();
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

        // this._backgroundGeometry = new THREE.PlaneGeometry(this._halfW * 2, this._halfH * 2);

        this._backgroundGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);

        // const vertices = [
        //     0, 0, 200,
        //     0, this._halfH * 2, 200,
        //     this._halfW * 2, 0.0, 200,
        //     this._halfW * 2, 0.0, 200,
        //     0.0, this._halfH * 2, 200,
        //     this._halfW * 2, this._halfH * 2, 200
        // ];

        // const newUvs = [
        //     0.0, this._halfH * 2,
        //     0.0, 0.0,
        //     this._halfW * 2, this._halfH * 2,
        //     0.0, 0.0,
        //     this._halfW * 2, 0.0,
        //     this._halfW * 2, this._halfH * 2
        // ];

        // this._backgroundGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const height = this._halfH * 2;
        const width = (this._halfW * 2) - 550;
        let vValue = 0;
        let uValue = 0;

        const heightAspectRatio = (height * window.innerHeight) / width;
        let widthAspectRatio = 0;

        if (heightAspectRatio >= window.innerHeight) {
            vValue = ((heightAspectRatio - window.innerHeight) / 2) / heightAspectRatio;
        } else {
            widthAspectRatio = (width * window.innerWidth) / height;
            uValue = ((widthAspectRatio - window.innerWidth) / 2) / widthAspectRatio;
        }

        const background = [
            new THREE.Vector2(0 + uValue, 0 + vValue),
            new THREE.Vector2(1 - uValue, 0 + vValue),
            new THREE.Vector2(1 - uValue, 1 - vValue),
            new THREE.Vector2(0 + uValue, 1 - vValue)
        ];


        this._backgroundGeometry.faceVertexUvs[0] = [];
        this._backgroundGeometry.faceVertexUvs[0][0] = [ background[3], background[0], background[2] ];
        this._backgroundGeometry.faceVertexUvs[0][1] = [ background[0], background[1], background[2] ];

        // this._backgroundGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(background, 2));
    }

    /**
     * To do.
     *
     * @returns {void}
     */
    _addMaterial() {
        this._textureLoader = new THREE.TextureLoader();

        this._material = new THREE.MeshNormalMaterial();
        const texture = new THREE.VideoTexture(this._background);

        this._backgroundMaterial = new THREE.MeshBasicMaterial({
            map: texture
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
        this._mesh.position.y += 355;
        this._mesh.position.z += 260;
        this._backgroundMesh = new THREE.Mesh(this._backgroundGeometry, this._backgroundMaterial);
        this._scene.add(this._mesh);
        this._scene.add(this._backgroundMesh);
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
        this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBuffer, 3));
        this._geometry.attributes.position.needsUpdate = true;
        this._renderer.render(this._scene, this._camera);
    }
}
