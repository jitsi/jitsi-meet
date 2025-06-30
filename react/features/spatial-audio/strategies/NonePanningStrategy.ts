import { IPanningStrategy, ISpatialPosition, ISpatialAudioSettings, SpatialAudioType } from '../types';

/**
 * None panning strategy - bypasses all spatial audio processing
 * Provides simple mono audio output with only gain control
 */
export class NonePanningStrategy implements IPanningStrategy {
    readonly type: SpatialAudioType = 'none';
    
    private gainNodes = new Map<string, GainNode>();
    private audioContext: AudioContext;
    
    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
    }
    
    createNodes(participantId: string): AudioNode[] {
        const gain = this.audioContext.createGain();
        
        // Connect gain directly to destination (bypass all spatial processing)
        gain.connect(this.audioContext.destination);
        
        // Store reference
        this.gainNodes.set(participantId, gain);
        
        console.log(`SpatialAudio: Created mono (none) nodes for participant ${participantId}`);
        
        return [gain];
    }
    
    updatePosition(participantId: string, position: ISpatialPosition): void {
        // No-op for mono audio - positions are ignored
        console.log(`SpatialAudio: Position update ignored for mono audio (participant ${participantId})`);
    }
    
    connectSource(participantId: string, source: AudioNode): void {
        const gain = this.gainNodes.get(participantId);
        if (!gain) {
            console.warn(`SpatialAudio: No gain node found for participant ${participantId}`);
            return;
        }
        
        source.connect(gain);
        console.log(`SpatialAudio: Connected source for participant ${participantId} to mono gain`);
    }
    
    disconnectParticipant(participantId: string): void {
        const gain = this.gainNodes.get(participantId);
        
        if (gain) {
            gain.disconnect();
        }
        
        console.log(`SpatialAudio: Disconnected mono nodes for participant ${participantId}`);
    }
    
    getOutputNode(participantId: string): AudioNode | null {
        return this.gainNodes.get(participantId) || null;
    }
    
    updateGlobalSettings(settings: ISpatialAudioSettings): void {
        // Update master volume for all participants
        this.gainNodes.forEach((gainNode, participantId) => {
            gainNode.gain.value = settings.masterVolume;
        });
        
        console.log('SpatialAudio: Updated mono global settings');
    }
    
    destroy(): void {
        // Disconnect all nodes
        this.gainNodes.forEach((gain, participantId) => {
            this.disconnectParticipant(participantId);
        });
        
        // Clear map
        this.gainNodes.clear();
        
        console.log('SpatialAudio: Mono strategy destroyed');
    }
} 