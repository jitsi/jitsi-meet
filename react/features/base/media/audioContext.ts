import logger from './logger';

// AudioContext für die gesamte Anwendung
let audioContext: AudioContext | null = null;

/**
 * Erstellt und gibt den AudioContext zurück
 * @returns {AudioContext} Der AudioContext
 */
export function getAudioContext(): AudioContext {
    if (!audioContext) {
        try {
            audioContext = new AudioContext();
            logger.info('AudioContext erfolgreich erstellt', {
                sampleRate: audioContext.sampleRate,
                state: audioContext.state,
                baseLatency: audioContext.baseLatency
            });

            // Event-Listener für State-Änderungen
            audioContext.addEventListener('statechange', () => {
                logger.debug('AudioContext State geändert:', audioContext?.state);
            });

        } catch (error) {
            logger.error('Fehler beim Erstellen des AudioContext:', error);
            throw error;
        }
    }
    
    return audioContext;
}

/**
 * Initialisiert den AudioContext
 * @returns {AudioContext} Der initialisierte AudioContext
 */
export function initAudioContext(): AudioContext {
    logger.info('AudioContext wird initialisiert...');
    const context = getAudioContext();
    logger.info('AudioContext Initialisierung abgeschlossen');
    return context;
}
