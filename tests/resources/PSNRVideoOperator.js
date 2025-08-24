/*
 * Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* jshint -W101 */

/**
 * @const
 */
var DEFAULT_FPS = 30;

/**
 * @const
 */
var DEFAULT_MIME = 'image/png';

/**
 * Create new Camera.
 * It allows to capture frames from video element.
 * @param {HTMLVideoElement} video source video element
 * @param {String} audioLevelsUserResource optional resource part of the MUC JID
 * which will enable audio level recording for the user identified by it
 * @constructor
 */
var Camera = function (video, audioLevelsUserResource) {
    this.audioLevels = [];
    this.frames = [];
    this.timestamps = [];
    this.aLvlUserResource = audioLevelsUserResource;
    this.video = video;
};

/**
 * Get camera id (video element id).
 * @returns {string} id
 */
Camera.prototype.getId = function () {
    return this.video.id;
};

/**
 * Start capturing video frames.
 * @param {number} [fps=DEFAULT_FPS] custom fps
 */
Camera.prototype.start = function (fps) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'none';
    document.body.appendChild(this.canvas);

    var width = this.video.videoWidth;
    var height = this.video.videoHeight;

    this.canvas.width = width;
    this.canvas.height = height;

    var context = this.canvas.getContext('2d');

    this.startTime = Date.now();
    this.interval = window.setInterval(function () {
        context.drawImage(this.video, 0, 0);
        this.timestamps.push(Date.now());
        this.frames.push(context.getImageData(0, 0, width, height));
        if (this.aLvlUserResource) {
            this.audioLevels.push(this.recordAudioLevel());
        }
    }.bind(this), Math.floor(1000 / (fps || DEFAULT_FPS)));
};

/**
 * Captures audio level value for the user recorded by this Camera instance
 * @return {Double} from 0.0 to 1.0 or -1 if undefined
 */
Camera.prototype.recordAudioLevel = function () {
    var level = APP.conference.getPeerSSRCAudioLevel(this.aLvlUserResource);
    return (level !== null && level !== undefined) ?
        level.toFixed(3) : (-1.0).toFixed(3);
};

/**
 * Stop capturing video frames.
 */
Camera.prototype.stop = function () {
    window.clearInterval(this.interval);
    this.endTime = Date.now();
};

/**
 * Get audio level for the frame at given position.
 * @param {number} pos frame position
 * @returns {number} the audio level value from 0.0 to 1.0 or -1 if undefined
 */
Camera.prototype.getAudioLevel = function (pos) {
    var level = this.audioLevels[pos];
    if (level == null || level == undefined) {
        throw new Error(
            "Cannot find audio level " + pos + " for video " + this.getId() +
             ", user resource: " + this.aLvlUserResource
        );
    }
    return level;
};

/**
 * Get number of captured frames.
 * @returns {number}
 */
Camera.prototype.getFramesCount = function () {
    return this.frames.length;
};

/**
 * Get frame image as base64 string.
 * @param {number} pos frame position
 * @param {string} [mimeType=DEFAULT_MIME] image mime type
 * @returns {string} image as base64 string
 */
Camera.prototype.getFrame = function (pos, mimeType) {
    var imageData = this.frames[pos];
    if (!imageData) {
        throw new Error(
            "cannot find frame " + pos + " for video " + this.getId()
        );
    }
    this.canvas.getContext('2d').putImageData(imageData, 0, 0);

    var prefix = 'data:' + mimeType + ';base64,';

    return this.canvas.toDataURL(
        mimeType || DEFAULT_MIME
    ).substring(prefix.length);
};

/**
 * Calculate real fps (may differ from expected one).
 * @returns {number} fps
 */
Camera.prototype.getRealFPS = function () {
    return this.frames.length * 1000 / (this.endTime - this.startTime);
};

/**
 * Calculate size of captured video frames.
 * @returns {number} size of captured frames (in bytes).
 */
Camera.prototype.getRawDataSize = function () {
    return this.frames.reduce(function (acc, imageData) {
        return acc + imageData.data.length;
    }, 0);
};

/**
 * Get RGBA a value of the pixel at the center of the frame at specified
 * position.
 * @param {number} pos frame position
 * @returns {List of string} with Reg, Green, Blue and Alpha values of the pixel
 */
Camera.prototype.getRGBAatTheCenter = function (pos) {
    var frame = this.frames[pos];
    if (!frame) {
        throw new Error(
            "Cannot find frame at " + pos + " for video " + this.getId()
        );
    }

    var pixel = [];
    var width = frame.width;
    var height = frame.height;
    var y = (width * height * 4/* RGBA */) / 2;
    var x = (width * 4/* RGBA */) / 2;

    for (var i = 0; i < 4; i++) {
        pixel.push(frame.data[y + x + i]);
    }

    return pixel;
};

/**
 * Get the timestamp of the frame at specified position.
 * @param {number} pos frame position
 * @returns {number} the timestamp obtained with Date.now() for the frame at
 * given position
 */
Camera.prototype.getTimestamp = function (pos) {
    var ts = this.timestamps[pos];
    if (ts == null || ts == undefined) {
        throw new Error(
            "Cannot find timestamp " + pos + " for video " + this.getId()
        );
    }
    return ts;
};

/**
 * Cleanup.
 */
Camera.prototype.cleanup = function () {
    document.body.removeChild(this.canvas);
};



/**
 * Video operator.
 * Manages Cameras.
 */
var VideoOperator = function () {
    this.cameras = [];
};

/**
 * Use Cameras to capture frames from all video elements.
 * @param {string[]} videoIds array if ids of target video elements.
 * @param {number} [fps=DEFAULT_FPS] fps for cameras
 */
VideoOperator.prototype.recordAll = function (videoIds,
                                              fps, aLvlUserResources) {
    for (var i =0; i < videoIds.length; i++) {
        var videoId = videoIds[i];
        var aLvlUserResource = aLvlUserResources ? aLvlUserResources[i] : null;
        var element = document.getElementById(videoId);
        if (!element) {
            throw new Error("cannot find element with id " + videoId);
        }

        var recorder = new Camera(element, aLvlUserResource);
        recorder.start(fps);

        this.cameras.push(recorder);
    }
};

/**
 * Stop all Cameras.
 */
VideoOperator.prototype.stop = function () {
    this.cameras.forEach(function (camera) {
        camera.stop();
    });
};

/**
 * Calculate real fps.
 * @returns {number} fps
 */
VideoOperator.prototype.getRealFPS = function () {
    return this.cameras.reduce(function (acc, camera) {
        return acc + camera.getRealFPS();
    }, 0) / this.cameras.length;
};

/**
 * Calculate size of captured video frames.
 * @returns {number} size of captured frames (in bytes).
 */
VideoOperator.prototype.getRawDataSize = function () {
    return this.cameras.reduce(function (acc, camera) {
        return acc + camera.getRawDataSize();
    }, 0) / this.cameras.length;
};

/**
 * Find Camera by id or throw an error.
 * @param {string} videoId
 * @returns {Camera}
 */
VideoOperator.prototype.getCamera = function (videoId) {
    for (var i = 0; i < this.cameras.length; i += 1) {
        if (this.cameras[i].getId() === videoId) {
            return this.cameras[i];
        }
    }

    throw new Error("cannot find camera with id " + videoId);
};

/**
 * Get number of frames captured by the Camera with specified id.
 * @param {string} videoId id of the camera
 * @returns {number} number of frames
 */
VideoOperator.prototype.getFramesCount = function (videoId) {
    return this.getCamera(videoId).getFramesCount();
};

/**
 * Get frame image as base64 string.
 * @param {string} videoId id of the camera
 * @param {number} pos frame position
 * @param {string} [mimeType=DEFAULT_MIME] image mime type
 * @returns {string} image as base64 string
 */
VideoOperator.prototype.getFrame = function (videoId, pos, mimeType) {
    return this.getCamera(videoId).getFrame(pos, mimeType);
};

/**
 * Get audio level for the frame at specified position.
 * @param {number} pos frame position
 * @returns {number} audio level value from 0.0 to 1.0
 */
VideoOperator.prototype.getAudioLevel = function (videoId, pos) {
    return this.getCamera(videoId).getAudioLevel(pos);
};

/**
 * Get RGBA value of the pixel at the center of the frame at specified position.
 * @param {number} pos frame position
 * @returns {array of number} [R,G,B,A] pixel values from 0 to 255.
 */
VideoOperator.prototype.getRGBAatTheCenter = function (videoId, pos) {
    return this.getCamera(videoId).getRGBAatTheCenter(pos);
};

/**
 * Get timestamp of the frame at specified position.
 * @param {number} pos frame position
 * @returns {number} timestamp of the frame obtained with Date.now()
 */
VideoOperator.prototype.getTimestamp = function (videoId, pos) {
    return this.getCamera(videoId).getTimestamp(pos);
};

/**
 * Cleanup.
 */
VideoOperator.prototype.cleanup = function () {
    this.cameras.forEach(function (camera) {
        camera.cleanup();
    });
};

window.VideoOperator = VideoOperator;
