/* eslint-disable */
/*
  Helper for Three.js
*/
import * as THREE from 'three'

export const JeelizThreeHelper = (function(){
  // internal settings:
  const _settings = {
    rotationOffsetX: 0.0, // negative -> look upper. in radians
    pivotOffsetYZ: [0.2, 0.6],// YZ of the distance between the center of the cube and the pivot
    
    detectionThreshold: 0.8, // sensibility, between 0 and 1. Less -> more sensitive
    detectionHysteresis: 0.02,

    //tweakMoveYRotateX: 0,//0.5, // tweak value: move detection window along Y axis when rotate the face around X (look up <-> down)
    
    cameraMinVideoDimFov: 35 // Field of View for the smallest dimension of the video in degrees
  };

  // private vars:
  let _threeRenderer = null,
      _threeScene = null,
      _threeVideoMesh = null,
      _threeVideoTexture = null,
      _threeTranslation = null;

  let _maxFaces = -1,
      _isMultiFaces = false,
      _detectCallback = null,
      _isVideoTextureReady = false,
      _isSeparateThreeCanvas = false,
      _faceFilterCv = null,
      _videoElement = null,
      _isDetected = false,
      _scaleW = 1,
      _canvasAspectRatio = -1;

  const _threeCompositeObjects = [];
    
  let _gl = null,
      _glVideoTexture = null,
      _glShpCopyCut = null,
      _glShpCopyCutVideoMatUniformPointer = null;

  let _videoTransformMat2 = null;

  // private funcs:
  function destroy(){
    _isVideoTextureReady = false;
    _threeCompositeObjects.splice(0);
    if (_threeVideoTexture){
      _threeVideoTexture.dispose();
      _threeVideoTexture = null;
    }
  }

  function create_threeCompositeObjects(){
    for (let i=0; i<_maxFaces; ++i){
      // COMPOSITE OBJECT WHICH WILL TRACK A DETECTED FACE
      const threeCompositeObject = new THREE.Object3D();
      threeCompositeObject.frustumCulled = false;
      threeCompositeObject.visible = false;

      _threeCompositeObjects.push(threeCompositeObject);
      _threeScene.add(threeCompositeObject);
    }
  }

  function create_videoScreen(){
    const videoScreenVertexShaderSource = "attribute vec2 position;\n\
        uniform mat2 videoTransformMat2;\n\
        varying vec2 vUV;\n\
        void main(void){\n\
          gl_Position = vec4(position, 0., 1.);\n\
          vUV = 0.5 + videoTransformMat2 * position;\n\
        }";
    const videoScreenFragmentShaderSource = "precision lowp float;\n\
        uniform sampler2D samplerVideo;\n\
        varying vec2 vUV;\n\
        void main(void){\n\
          gl_FragColor = texture2D(samplerVideo, vUV);\n\
        }";

    if (_isSeparateThreeCanvas){
      const compile_shader = function(source, type, typeString) {
        const glShader = _gl.createShader(type);
        _gl.shaderSource(glShader, source);
        _gl.compileShader(glShader);
        if (!_gl.getShaderParameter(glShader, _gl.COMPILE_STATUS)) {
          alert("ERROR IN " + typeString + " SHADER: " + _gl.getShaderInfoLog(glShader));
          return null;
        }
        return glShader;
      };

      const glShaderVertex =   compile_shader(videoScreenVertexShaderSource, _gl.VERTEX_SHADER, 'VERTEX');
      const glShaderFragment = compile_shader(videoScreenFragmentShaderSource, _gl.FRAGMENT_SHADER, 'FRAGMENT');

      _glShpCopyCut = _gl.createProgram();
      _gl.attachShader(_glShpCopyCut, glShaderVertex);
      _gl.attachShader(_glShpCopyCut, glShaderFragment);

      _gl.linkProgram(_glShpCopyCut);
      const samplerVideo = _gl.getUniformLocation(_glShpCopyCut, 'samplerVideo');
      _glShpCopyCutVideoMatUniformPointer = _gl.getUniformLocation(_glShpCopyCut, 'videoTransformMat2');
      
      return;
    }

    // init video texture with red:
    _threeVideoTexture = new THREE.DataTexture( new Uint8Array([255,0,0]), 1, 1, THREE.RGBFormat);
    _threeVideoTexture.needsUpdate = true;

    // CREATE THE VIDEO BACKGROUND:
    const videoMaterial = new THREE.RawShaderMaterial({
      depthWrite: false,
      depthTest: false,
      vertexShader: videoScreenVertexShaderSource,
      fragmentShader: videoScreenFragmentShaderSource,
      uniforms:{
        samplerVideo: {value: _threeVideoTexture},
        videoTransformMat2: {
          value: _videoTransformMat2
        }
      }
    });

    const videoGeometry = new THREE.BufferGeometry()
    const videoScreenCorners = new Float32Array([-1,-1,   1,-1,   1,1,   -1,1]);
    videoGeometry.addAttribute( 'position', new THREE.BufferAttribute( videoScreenCorners, 2 ) );
    videoGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0,1,2, 0,2,3]), 1));
    _threeVideoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
    that.apply_videoTexture(_threeVideoMesh);
    _threeVideoMesh.renderOrder = -1000; // render first
    _threeVideoMesh.frustumCulled = false;
    _threeScene.add(_threeVideoMesh);
  } //end create_videoScreen()

  function detect(detectState){
    _threeCompositeObjects.forEach(function(threeCompositeObject, i){
      _isDetected = threeCompositeObject.visible;
      const ds = detectState[i];
      if (_isDetected && ds.detected < _settings.detectionThreshold-_settings.detectionHysteresis){
        
        // DETECTION LOST
        if (_detectCallback) _detectCallback(i, false);
        threeCompositeObject.visible = false;
      } else if (!_isDetected && ds.detected > _settings.detectionThreshold+_settings.detectionHysteresis){
        
        // FACE DETECTED
        if (_detectCallback) _detectCallback(i, true);
        threeCompositeObject.visible = true;
      }
    }); //end loop on all detection slots
  }

  function update_poses(ds, threeCamera){
    // tan( <horizontal FoV> / 2 ):
    const halfTanFOVX = Math.tan(threeCamera.aspect * threeCamera.fov * Math.PI/360); //tan(<horizontal FoV>/2), in radians (threeCamera.fov is vertical FoV)

    _threeCompositeObjects.forEach(function(threeCompositeObject, i){
      if (!threeCompositeObject.visible) return;
      const detectState = ds[i];

      // tweak Y position depending on rx:
      //const tweak = _settings.tweakMoveYRotateX * Math.tan(detectState.rx);
      const cz = Math.cos(detectState.rz), sz = Math.sin(detectState.rz);
      
      // relative width of the detection window (1-> whole width of the detection window):
      const W = detectState.s * _scaleW;

      // distance between the front face of the cube and the camera:
      const DFront = 1 / ( 2 * W * halfTanFOVX );
      
      // D is the distance between the center of the unit cube and the camera:
      const D = DFront + 0.5;

      // coords in 2D of the center of the detection window in the viewport:
      const xv = detectState.x * _scaleW;
      const yv = detectState.y * _scaleW;

      // coords in 3D of the center of the cube (in the view coordinates system):
      const z = -D;   // minus because view coordinate system Z goes backward
      const x = xv * D * halfTanFOVX;
      const y = yv * D * halfTanFOVX / _canvasAspectRatio;

      // set position before pivot:
      threeCompositeObject.position.set(-sz*_settings.pivotOffsetYZ[0], -cz*_settings.pivotOffsetYZ[0], -_settings.pivotOffsetYZ[1]);

      // set rotation and apply it to position:
      threeCompositeObject.rotation.set(detectState.rx+_settings.rotationOffsetX, detectState.ry, detectState.rz, "ZYX");
      threeCompositeObject.position.applyEuler(threeCompositeObject.rotation);

      // add translation part:
      _threeTranslation.set(x, y+_settings.pivotOffsetYZ[0], z+_settings.pivotOffsetYZ[1]);
      threeCompositeObject.position.add(_threeTranslation);
    }); //end loop on composite objects
  }

  //public methods:
  const that = {
    // launched with the same spec object than callbackReady. set spec.threeCanvasId to the ID of the threeCanvas to be in 2 canvas mode:
    init: function(spec, detectCallback){
      destroy();

      _maxFaces = spec.maxFacesDetected;
      _glVideoTexture = spec.videoTexture;
      _videoTransformMat2 = spec.videoTransformMat2;
      _gl = spec.GL;
      _faceFilterCv = spec.canvasElement;
      _isMultiFaces = (_maxFaces>1);
      _videoElement = spec.videoElement;

      // enable 2 canvas mode if necessary:
      let threeCanvas = null;
      if (spec.threeCanvasId){
        _isSeparateThreeCanvas = true;
        // adjust the threejs canvas size to the threejs canvas:
        threeCanvas = document.getElementById(spec.threeCanvasId);
        threeCanvas.setAttribute('width', _faceFilterCv.width);
        threeCanvas.setAttribute('height', _faceFilterCv.height);
      } else {
        threeCanvas = _faceFilterCv;
      }

      if (typeof(detectCallback) !== 'undefined'){
        _detectCallback = detectCallback;
      }

       // init THREE.JS context:
      _threeRenderer = new THREE.WebGLRenderer({
        context: (_isSeparateThreeCanvas) ? null : _gl,
        canvas: threeCanvas,
        alpha: (_isSeparateThreeCanvas || spec.alpha) ? true : false
      });

      _threeScene = new THREE.Scene();
      _threeTranslation = new THREE.Vector3();

      create_threeCompositeObjects();
      create_videoScreen();

      // handle device orientation change:
      window.addEventListener('orientationchange', function(){
        setTimeout(JEELIZFACEFILTER.resize, 1000);
      }, false);
      
      const returnedDict = {
        videoMesh: _threeVideoMesh,
        renderer: _threeRenderer,
        scene: _threeScene
      };
      if (_isMultiFaces){
        returnedDict.faceObjects = _threeCompositeObjects
      } else {
        returnedDict.faceObject = _threeCompositeObjects[0];
      }
      return returnedDict;
    }, //end that.init()

    detect: function(detectState){
      const ds = (_isMultiFaces) ? detectState : [detectState];

      // update detection states:
      detect(ds);
    },

    get_isDetected: function() {
      return _isDetected;
    },

    render: function(detectState, threeCamera){
      const ds = (_isMultiFaces) ? detectState : [detectState];

      // update detection states then poses:
      detect(ds);
      update_poses(ds, threeCamera);

      if (_isSeparateThreeCanvas){
        // render the video texture on the faceFilter canvas:
        _gl.viewport(0, 0, _faceFilterCv.width, _faceFilterCv.height);
        _gl.useProgram(_glShpCopyCut);
        _gl.uniformMatrix2fv(_glShpCopyCutVideoMatUniformPointer, false, _videoTransformMat2);
        _gl.activeTexture(_gl.TEXTURE0);
        _gl.bindTexture(_gl.TEXTURE_2D, _glVideoTexture);
        _gl.drawElements(_gl.TRIANGLES, 3, _gl.UNSIGNED_SHORT, 0);
      } else {
        // reinitialize the state of THREE.JS because JEEFACEFILTER have changed stuffs:
        // -> can be VERY costly !
        _threeRenderer.state.reset();        
      }

      // trigger the render of the THREE.JS SCENE:
      _threeRenderer.render(_threeScene, threeCamera);
    },

    sortFaces: function(bufferGeometry, axis, isInv){ // sort faces long an axis
      // Useful when a bufferGeometry has alpha: we should render the last faces first
      const axisOffset = {X:0, Y:1, Z:2}[axis.toUpperCase()];
      const sortWay = (isInv) ? -1 : 1;

      // fill the faces array:
      const nFaces = bufferGeometry.index.count/3;
      const faces = new Array(nFaces);
      for (let i=0; i<nFaces; ++i){
        faces[i] = [bufferGeometry.index.array[3*i], bufferGeometry.index.array[3*i+1], bufferGeometry.index.array[3*i+2]];
      }

      // compute centroids:
      const aPos = bufferGeometry.attributes.position.array;
      const centroids = faces.map(function(face, faceIndex){
        return [
          (aPos[3*face[0]]+aPos[3*face[1]]+aPos[3*face[2]])/3,       // X
          (aPos[3*face[0]+1]+aPos[3*face[1]+1]+aPos[3*face[2]+1])/3, // Y
          (aPos[3*face[0]+2]+aPos[3*face[1]+2]+aPos[3*face[2]+2])/3, // Z
          face
        ];
      });

      // sort centroids:
      centroids.sort(function(ca, cb){
        return (ca[axisOffset]-cb[axisOffset]) * sortWay;
      });

      // reorder bufferGeometry faces:
      centroids.forEach(function(centroid, centroidIndex){
        const face = centroid[3];
        bufferGeometry.index.array[3*centroidIndex] = face[0];
        bufferGeometry.index.array[3*centroidIndex+1] = face[1];
        bufferGeometry.index.array[3*centroidIndex+2] = face[2];
      });
    }, //end sortFaces

    get_threeVideoTexture: function(){
      return _threeVideoTexture;
    },

    apply_videoTexture: function(threeMesh){
      if (_isVideoTextureReady){
        return;
      }
      threeMesh.onAfterRender = function(){
        // Replace _threeVideoTexture.__webglTexture by the real video texture:
        try {
          _threeRenderer.properties.update(_threeVideoTexture, '__webglTexture', _glVideoTexture);
          _threeVideoTexture.magFilter = THREE.LinearFilter;
          _threeVideoTexture.minFilter = THREE.LinearFilter;
          _isVideoTextureReady = true;
        } catch(e){
          console.log('WARNING in JeelizThreeHelper: the glVideoTexture is not fully initialized');
        }
        delete(threeMesh.onAfterRender);
      };
    },

    // create an occluder, IE a transparent object which writes on the depth buffer:
    create_threejsOccluder: function(occluderURL, callback){
      const occluderMesh = new THREE.Mesh();
      new THREE.BufferGeometryLoader().load(occluderURL, function(occluderGeometry){
        const mat = new THREE.ShaderMaterial({
          vertexShader: THREE.ShaderLib.basic.vertexShader,
          fragmentShader: "precision lowp float;\n void main(void){\n gl_FragColor=vec4(1.,0.,0.,1.);\n }",
          uniforms: THREE.ShaderLib.basic.uniforms,
          colorWrite: false
        });
        
        occluderMesh.renderOrder = -1; //render first
        occluderMesh.material = mat;
        occluderMesh.geometry = occluderGeometry;
        if (typeof(callback)!=='undefined' && callback) callback(occluderMesh);
      });
      return occluderMesh;
    },
    
    set_pivotOffsetYZ: function(pivotOffset) {
      _settings.pivotOffsetYZ = pivotOffset;
    },

    create_camera: function(zNear, zFar){
      const threeCamera = new THREE.PerspectiveCamera(1, 1, (zNear) ? zNear : 0.1, (zFar) ? zFar : 100);
      that.update_camera(threeCamera);

      return threeCamera;
    },

    update_camera: function(threeCamera){
      // compute aspectRatio:
      const canvasElement = _threeRenderer.domElement;
      const cvw = canvasElement.width;
      const cvh = canvasElement.height;
      _canvasAspectRatio = cvw / cvh;

      // compute vertical field of view:
      const vw = _videoElement.videoWidth;
      const vh = _videoElement.videoHeight;
      const videoAspectRatio = vw / vh;
      const fovFactor = (vh > vw) ? (1.0 / videoAspectRatio) : 1.0;
      const fov = _settings.cameraMinVideoDimFov * fovFactor;
      console.log('INFO in JeelizThreeHelper - update_camera(): Estimated vertical video FoV is', fov);
      
      // compute X and Y offsets in pixels:
      let scale = 1.0;
      if (_canvasAspectRatio > videoAspectRatio) {
        // the canvas is more in landscape format than the video, so we crop top and bottom margins:
        scale = cvw / vw;
      } else {
        // the canvas is more in portrait format than the video, so we crop right and left margins:
        scale = cvh / vh;
      }
      const cvws = vw * scale, cvhs = vh * scale;
      const offsetX = (cvws - cvw) / 2.0;
      const offsetY = (cvhs - cvh) / 2.0;
      _scaleW = cvw / cvws;

      // apply parameters:
      threeCamera.aspect = _canvasAspectRatio;
      threeCamera.fov = fov;
      console.log('INFO in JeelizThreeHelper.update_camera(): camera vertical estimated FoV is', fov, 'deg');
      threeCamera.setViewOffset(cvws, cvhs, offsetX, offsetY, cvw, cvh);
      threeCamera.updateProjectionMatrix();

      // update drawing area:
      _threeRenderer.setSize(cvw, cvh, false);
      _threeRenderer.setViewport(0, 0, cvw, cvh);
    }, //end update_camera()

    resize: function(w, h, threeCamera){
      _threeRenderer.domElement.width = w;
      _threeRenderer.domElement.height = h;
      JEELIZFACEFILTER.resize();
      if (threeCamera){
        that.update_camera(threeCamera);
      }
    }
  }
  return that;
})();

