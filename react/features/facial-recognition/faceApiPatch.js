/* eslint-disable */
// From: https://github.com/justadudewhohacks/face-api.js/issues/47
// This is needed because face-api.js does not support working in a WebWorker natively
// Updated Dec 1 2020 to work on latest Chrome (tested in WebWorkers on Chrome Mobile on Android / Google Pixel 3 as well)
if(!self.OffscreenCanvas) {
	self.OffscreenCanvas = class OffscreenCanvas {
		constructor() {

		}
	}
}

if(!self.OffscreenCanvasRenderingContext2D) {
	self.OffscreenCanvasRenderingContext2D = class OffscreenCanvasRenderingContext2D {
		constructor() {
			
		}
	}
}

self.Canvas = self.HTMLCanvasElement = OffscreenCanvas;
// self.HTMLCanvasElement.name = 'HTMLCanvasElement';
// self.Canvas.name = 'Canvas';

self.CanvasRenderingContext2D = OffscreenCanvasRenderingContext2D;

function HTMLImageElement(){}
function HTMLVideoElement(){}

self.Image = HTMLImageElement;
self.Video = HTMLVideoElement;

function Storage () {
	let _data = {};
	this.clear = function(){ return _data = {}; };
	this.getItem = function(id){ return _data.hasOwnProperty(id) ? _data[id] : undefined; };
	this.removeItem = function(id){ return delete _data[id]; };
	this.setItem = function(id, val){ return _data[id] = String(val); };
}
class Document extends EventTarget {}

self.document = new Document();

self.window = self.Window = self;
self.localStorage = new Storage();

function createElement(element) {
	switch(element) {
		case 'canvas':
			let canvas = new Canvas(1,1);
			canvas.localName = 'canvas';
			canvas.nodeName = 'CANVAS';
			canvas.tagName = 'CANVAS';
			canvas.nodeType = 1;
			canvas.innerHTML = '';
			canvas.remove = () => { console.log('nope'); };
			return canvas;
		default:
			console.log('arg', element);
			break;
	}
}

document.createElement = createElement;
document.location = self.location;

// These are the same checks face-api.js/isBrowser does
if(!typeof window == 'object') {
	console.warn("Check failed: window");
}
if(typeof document === 'undefined') {
	console.warn("Check failed: document");
}
if(typeof HTMLImageElement === 'undefined') {
	console.warn("Check failed: HTMLImageElement");
}
if(typeof HTMLCanvasElement === 'undefined') {
	console.warn("Check failed: HTMLCanvasElement");
}
if(typeof HTMLVideoElement === 'undefined') {
	console.warn("Check failed: HTMLVideoElement");
}
if(typeof ImageData === 'undefined') {
	console.warn("Check failed: ImageData");
}
if(typeof CanvasRenderingContext2D === 'undefined') {
	console.warn("Check failed: CanvasRenderingContext2D");
}

self.window = window;
self.document = document;
self.HTMLImageElement = HTMLImageElement;
self.HTMLVideoElement = HTMLVideoElement;

// These are the same checks face-api.js/isBrowser does
const isBrowserCheck = typeof window === 'object'
	&& typeof document !== 'undefined'
	&& typeof HTMLImageElement !== 'undefined'
	&& typeof HTMLCanvasElement !== 'undefined'
	&& typeof HTMLVideoElement !== 'undefined'
	&& typeof ImageData !== 'undefined'
	&& typeof CanvasRenderingContext2D !== 'undefined';
;
if(!isBrowserCheck) {
	throw new Error("Failed to monkey patch for face-api, face-api will fail");
}
