/**
 * Audio utility functions for processing and format conversion
 * Adapted from standalone-meeting-assist
 */

/**
 * Convert WebM audio blob to Float32Array for Whisper processing
 */
export async function convertWebMToFloat32(webmBlob) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onloadend = async () => {
      try {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const arrayBuffer = fileReader.result;
        const decoded = await audioContext.decodeAudioData(arrayBuffer);
        
        let audio;
        if (decoded.numberOfChannels === 2) {
          // Convert stereo to mono
          const SCALING_FACTOR = Math.sqrt(2);
          const left = decoded.getChannelData(0);
          const right = decoded.getChannelData(1);
          
          audio = new Float32Array(left.length);
          for (let i = 0; i < decoded.length; ++i) {
            audio[i] = SCALING_FACTOR * (left[i] + right[i]) / 2;
          }
        } else {
          // Use first channel for mono
          audio = decoded.getChannelData(0);
        }
        
        resolve(audio);
      } catch (error) {
        reject(error);
      }
    };
    
    fileReader.onerror = () => reject(new Error('FileReader error'));
    fileReader.readAsArrayBuffer(webmBlob);
  });
}

/**
 * Create a MediaRecorder for audio capture
 */
export function createAudioRecorder(stream, options = {}) {
  const {
    mimeType = 'audio/webm;codecs=opus',
    audioBitsPerSecond = 128000
  } = options;

  try {
    return new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond
    });
  } catch (error) {
    console.warn('Falling back to default MediaRecorder options:', error);
    return new MediaRecorder(stream);
  }
}

/**
 * Get user media with optimal settings for speech recognition
 */
export async function getUserMediaForSpeech(deviceId = null) {
  const constraints = {
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.warn('Failed to get media with optimal settings, falling back:', error);
    // Fallback to basic audio capture
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

/**
 * Get available audio input devices
 */
export async function getAudioInputDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('Error enumerating audio devices:', error);
    return [];
  }
}

/**
 * Get available audio output devices
 */
export async function getAudioOutputDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audiooutput');
  } catch (error) {
    console.error('Error enumerating audio output devices:', error);
    return [];
  }
}

/**
 * Create an audio context for processing
 */
export function createAudioContext(sampleRate = 16000) {
  return new AudioContext({ sampleRate });
}

/**
 * Convert Float32Array to audio blob
 */
export function float32ArrayToBlob(float32Array, sampleRate = 16000) {
  // Create a 16-bit PCM WAV file
  const length = float32Array.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float32 to int16
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Play audio from Float32Array
 */
export async function playAudioFromFloat32(float32Array, sampleRate = 16000) {
  const audioContext = createAudioContext(sampleRate);
  const audioBuffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
  audioBuffer.copyToChannel(float32Array, 0);
  
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  
  return new Promise((resolve) => {
    source.onended = resolve;
  });
}