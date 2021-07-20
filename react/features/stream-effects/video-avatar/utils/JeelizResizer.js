/* eslint-disable */

export const JeelizResizer = (function(){
  // private vars:
  let _domCanvas = null,
      _whCanvasPx = null,
      _isApplyCSS = false,
      _resizeAttemptsCounter = 0,
      _overSamplingFactor = 1,
      _isFullScreen = false,
      _timerFullScreen = null,
      _callbackResize = null,
      _isInvFullscreenWH = false;

  const _cameraResolutions = [ // all resolutions should be in landscape mode
    [640,480],
    [768,480],
    [800,600],
    [960,640],
    [960,720],
    [1024,768],
    [1280,720],
    [1920, 1080]
  ];
  
  //private functions
  function add_CSStransform(domElement, CSS){
    const CSStransform = domElement.style.transform;
    if (CSStransform.indexOf(CSS) !== -1) return;
    domElement.style.transform = CSS + ' ' + CSStransform;
  }

  // Compute overlap between 2 rectangles A and B
  // characterized by their width and their height in pixels
  // the rectangles are centered
  // return the ratio (pixels overlaped)/(total pixels)
  function compute_overlap(whA, whB){ 
    const aspectRatioA = whA[0] / whA[1];
    const aspectRatioB = whB[0] / whB[1]; //higher aspectRatio -> more landscape
    
    var whLandscape, whPortrait;
    if (aspectRatioA > aspectRatioB){ 
      whLandscape = whA, whPortrait = whB;
    } else {
      whLandscape = whB, whPortrait = whA;
    }

    // The overlapped area will be always a rectangle
    const areaOverlap = Math.min(whLandscape[0], whPortrait[0]) * Math.min(whLandscape[1], whPortrait[1]);
    
    var areaTotal;
    if (whLandscape[0]>=whPortrait[0] && whLandscape[1]>=whPortrait[1]){ //union is a rectangle
      areaTotal = whLandscape[0]*whLandscape[1];
    } else if (whPortrait[0]>whLandscape[0] && whPortrait[1]>whLandscape[1]){ //union is a rectangle
      areaTotal = whPortrait[0]*whPortrait[1];
    } else { //union is a cross
      areaTotal = whLandscape[0]*whLandscape[1];
      areaTotal += (whPortrait[1]-whLandscape[1])*whPortrait[0];
    }

    return areaOverlap / areaTotal;
  } //end compute_overlap()

  function update_sizeCanvas(){
    // const domRect = _domCanvas.getBoundingClientRect();
    apply_sizeCanvas(_domCanvas.width, _domCanvas.height);
  }

  function apply_sizeCanvas(width, height){
    _whCanvasPx = [
      Math.round(_overSamplingFactor * width),
      Math.round(_overSamplingFactor * height)
    ];

    // set canvas resolution:
    _domCanvas.setAttribute('width',  _whCanvasPx[0]);
    _domCanvas.setAttribute('height', _whCanvasPx[1]);

    // canvas display size:
    if (_isApplyCSS){
      _domCanvas.style.width = width.toString() + 'px';
      _domCanvas.style.height = height.toString() + 'px';
    }
  }

  function on_windowResize(){
    // avoid to resize too often using a timer
    // (it can create weird bug with some browsers)
    if (_timerFullScreen){
      clearTimeout(_timerFullScreen);
    }
    _timerFullScreen = setTimeout(resize_fullScreen, 50);
  }

  function resize_canvasToFullScreen(){
    const wh = [window['innerWidth'], window['innerHeight']];
    if (_isInvFullscreenWH){
      wh.reverse();
    }
    apply_sizeCanvas(wh[0], wh[1]);
  }

  function resize_fullScreen(){
    resize_canvasToFullScreen();
    JEELIZFACEFILTER.resize();
    _timerFullScreen = null;
    if (_callbackResize) {
      _callbackResize();
    }
  }

  // public methods:
  const that = {
    // return true or false if the device is in portrait or landscape mode
    // see https://stackoverflow.com/questions/4917664/detect-viewport-orientation-if-orientation-is-portrait-display-alert-message-ad
    is_portrait: function(){
      try{
        if (window['matchMedia']("(orientation: portrait)")['matches']){
          return true;
        } else {
          return false;
        }
      } catch(e){
        return (window['innerHeight'] > window['innerWidth']);
      }
    },

    // check whether the user is using IOS or not
    // see https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
    check_isIOS: function(){
      const isIOS = /iPad|iPhone|iPod/.test(navigator['userAgent']) && !window['MSStream'];
      return isIOS;
    },

    // Should be called only if IOS was detected
    // see https://stackoverflow.com/questions/8348139/detect-ios-version-less-than-5-with-javascript
    get_IOSVersion: function(){ 
      const v = (navigator['appVersion']).match(/OS (\d+)_(\d+)_?(\d+)?/);
      return (v.length > 2) ? [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)] : [0, 0, 0];
    },

    // Check whether the user is using Android or not
    // see https://stackoverflow.com/questions/6031412/detect-android-phone-via-javascript-jquery
    check_isAndroid: function(){
      const ua = navigator['userAgent'].toLowerCase();
      return (ua.indexOf('android') !== -1);
    },

    // Should be called only if Android was detected
    // see https://stackoverflow.com/questions/7184573/pick-up-the-android-version-in-the-browser-by-javascript
    get_androidVersion: function(){
      const ua = navigator['userAgent'].toLowerCase(); 
      const match = ua.match(/android\s([0-9\.]*)/i);
      if (!match || match.length<2){
        return [0,0,0];
      }
      const v = match[1].split('.');
      return [
        parseInt(v[0], 10),
        parseInt(v[1], 10),
        parseInt(v[2] || 0, 10)
      ];
    },

    // to get a video of 480x640 (480 width and 640 height)
    // with a mobile phone in portrait mode, the default implementation
    // should require a 480x640 video (Chrome, Firefox)
    // but bad implementations needs to always request landscape resolutions (so 640x480)
    // see https://github.com/jeeliz/jeelizFaceFilter/issues/144
    require_flipVideoWHIfPortrait: function(){
      // disabled because of https://github.com/jeeliz/jeelizFaceFilter/issues/144
      // seems quite a mess though...
      
      /* if (that.check_isIOS()){
        //the user is using IOS
        const version = that.get_IOSVersion();
        if (version[0] >= 13){
          if (version[1] <= 1 // IOS 13.0.X
              || (version[1] === 1 && version[2] < 3)){ // IOS 13.1.X with X<3
            return false;
          }
        }
      }

      if (that.check_isAndroid()){
        const version = that.get_androidVersion();
        if (version[0] >= 9){ // Android 9+
          return false;
        }
      } */

      // normal implementation
      return false;
    },

    // size canvas to the right resolution
    // should be called after the page loading
    // when the canvas has already the right size
    // options:
    //  - <string> canvasId: id of the canvas
    //  - <HTMLCanvasElement> canvas: if canvasId is not provided
    //  - <function> callback: function to launch if there was an error or not
    //  - <float> overSamplingFactor: facultative. If 1, same resolution than displayed size (default). 
    //    If 2, resolution twice higher than real size
    //  - <boolean> CSSFlipX: if we should flip the canvas or not. Default: false
    //  - <boolean> isFullScreen: if we should set the canvas fullscreen. Default: false
    //  - <function> onResize: function called when the window is resized. Only enabled if isFullScreen = true
    //  - <boolean> isInvWH: if we should invert width and height for fullscreen mode only. default = false
    //  - <boolean> isApplyCSS: if we should also apply canvas dimensions as CSS. default = false
    size_canvas: function(optionsArg){
      const options = Object.assign({
        canvasId: 'undefinedCanvasId',
        canvas: null,
        overSamplingFactor: window.devicePixelRatio || 1,

        isFullScreen: false,
        isInvWH: false,
        CSSFlipX: false,
        isApplyCSS: false,
        
        onResize: null,
        callback: function(){}
      }, optionsArg);

      _domCanvas = (options.canvas) ? options.canvas : document.getElementById(options.canvasId);
      _isFullScreen = options.isFullScreen;
      _isInvFullscreenWH = options.isInvWH;
      _isApplyCSS = options.isApplyCSS;
      _overSamplingFactor = options.overSamplingFactor;

      if (_isFullScreen){
        // we are in fullscreen mode
        _callbackResize = options.onResize;
        
        resize_canvasToFullScreen();
        window.addEventListener('resize', on_windowResize, false);
        window.addEventListener('orientationchange', on_windowResize, false);
        
      } else { // not fullscreen mode

        // get display size of the canvas:
        // const domRect = _domCanvas.getBoundingClientRect();
        if (_domCanvas.width===0 || _domCanvas.height===0){
          console.log('WARNING in JeelizResize.size_canvas(): the canvas has its width or its height null, Retry a bit later...');
          if (++_resizeAttemptsCounter > 20){
            options.callback('CANNOT_RESIZECANVAS');
            return;
          }
          setTimeout(that.size_canvas.bind(null, options), 50);
          return;
        }

        // do resize canvas:
        _resizeAttemptsCounter = 0;        
        update_sizeCanvas();
      }

      // flip horizontally if required:
      if (options.CSSFlipX){
        add_CSStransform(_domCanvas, 'rotateY(180deg)');
      }

      // compute the best camera resolutions:
      const allResolutions = _cameraResolutions.map(function(x){
        return x.slice(0)
      });

      // if we are in portrait mode, the camera is also in portrait mode
      // so we need to set all resolutions to portrait mode
      if (that.is_portrait() && that.require_flipVideoWHIfPortrait()){
        allResolutions.forEach(function(wh){
          wh.reverse();
        });
      }

      // sort camera resolutions from the best to the worst:
      allResolutions.sort(function(resA, resB){
        return compute_overlap(resB, _whCanvasPx) - compute_overlap(resA, _whCanvasPx);        
      });

      // pick the best camera resolution:
      const bestCameraResolution = {
        'idealWidth':  allResolutions[0][0],
        'idealHeight': allResolutions[0][1]
      };

      console.log('INFO in JeelizResizer: bestCameraResolution =', bestCameraResolution);

      // launch the callback function after a small interval to let it
      // some time to size:
      setTimeout(options.callback.bind(null, false, bestCameraResolution), 1);
    }, //end size_canvas()

    // Should be called if the canvas is resized to update the canvas resolution:
    resize_canvas: function(){
      if (_isFullScreen){
        resize_canvasToFullScreen()        
      } else {
        update_sizeCanvas();
      }
    },

    get_canvasSize: function(){
      return _whCanvasPx;
    }
  }; //end that
  return that;
})();