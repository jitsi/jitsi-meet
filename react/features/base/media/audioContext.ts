// AudioContext für die gesamte Anwendung
let audioContext: AudioContext | null = null;

/**
 * Erstellt und gibt den AudioContext zurück
 * @returns {AudioContext} Der AudioContext
 */
export function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new AudioContext();
        console.log('AudioContext erstellt:', audioContext);
    }
    
    return audioContext;
}

/**
 * Initialisiert den AudioContext
 * @returns {AudioContext} Der initialisierte AudioContext
 */
export function initAudioContext(): AudioContext {
    return getAudioContext();
}
