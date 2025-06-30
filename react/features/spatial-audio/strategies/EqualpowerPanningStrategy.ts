import { IPanningStrategy, ISpatialPosition, ISpatialAudioSettings, SpatialAudioType } from '../types';

/**
 * Equalpower panning strategy using PannerNode with equalpower model
 * Provides spatial audio with equal power distribution
 */
export class EqualpowerPanningStrategy implements IPanningStrategy {
    readonly type: SpatialAudioType = 'equalpower';
    
    private pannerNodes = new Map<string, PannerNode>();
    private gainNodes = new Map<string, GainNode>();
    private audioContext: AudioContext;
    private listenerInitialized = false;
    
    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
        this.initializeListener();
    }
    
    private initializeListener(): void {
        if (this.listenerInitialized || !this.audioContext.listener) {
            return;
        }
        
        const listener = this.audioContext.listener;
        
        // Set listener orientation using modern API if available
        if ('forwardX' in listener) {
            listener.forwardX.value = 0;
            listener.forwardY.value = 0;
            listener.forwardZ.value = -1;
            listener.upX.value = 0;
            listener.upY.value = 1;
            listener.upZ.value = 0;
        } else {
            // Fallback for older browsers
            (listener as any).setOrientation(0, 0, -1, 0, 1, 0);
        }
        
        // Set listener position
        if ('positionX' in listener) {
            listener.positionX.value = 0;
            listener.positionY.value = 0;
            listener.positionZ.value = 1;
        } else {
            // Fallback for older browsers
            (listener as any).setPosition(0, 0, 1);
        }
        
        this.listenerInitialized = true;
        console.log('SpatialAudio: Equalpower listener initialized');
    }
    
    createNodes(participantId: string): AudioNode[] {
        const panner = this.audioContext.createPanner();
        const gain = this.audioContext.createGain();
        
        // Configure equalpower panner
        panner.panningModel = 'equalpower';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        
        // Set default orientation
        if ('orientationX' in panner) {
            panner.orientationX.value = 1;
            panner.orientationY.value = 0;
            panner.orientationZ.value = 0;
        } else {
            // Fallback for older browsers
            (panner as any).setOrientation(1, 0, 0);
        }
        
        // Connect panner to gain
        panner.connect(gain);
        
        // Connect gain to destination
        gain.connect(this.audioContext.destination);
        
        // Store references
        this.pannerNodes.set(participantId, panner);
        this.gainNodes.set(participantId, gain);
        
        console.log(`SpatialAudio: Created equalpower nodes for participant ${participantId}`);
        
        return [panner, gain];
    }
    
    updatePosition(participantId: string, position: ISpatialPosition): void {
        const panner = this.pannerNodes.get(participantId);
        if (!panner) {
            console.warn(`SpatialAudio: No equalpower panner found for participant ${participantId}`);
            return;
        }
        
        // Set position using modern API if available
        if ('positionX' in panner) {
            panner.positionX.value = position.x;
            panner.positionY.value = position.y;
            panner.positionZ.value = position.z || 0;
        } else {
            // Fallback for older browsers
            (panner as any).setPosition(position.x, position.y, position.z || 0);
        }
        
        console.log(`SpatialAudio: Updated equalpower position for ${participantId} to x=${position.x}, y=${position.y}, z=${position.z || 0}`);
    }
    
    connectSource(participantId: string, source: AudioNode): void {
        const panner = this.pannerNodes.get(participantId);
        if (!panner) {
            console.warn(`SpatialAudio: No equalpower panner found for participant ${participantId}`);
            return;
        }
        
        source.connect(panner);
        console.log(`SpatialAudio: Connected source for participant ${participantId} to equalpower panner`);
    }
    
    disconnectParticipant(participantId: string): void {
        const panner = this.pannerNodes.get(participantId);
        const gain = this.gainNodes.get(participantId);
        
        if (panner) {
            panner.disconnect();
        }
        if (gain) {
            gain.disconnect();
        }
        
        console.log(`SpatialAudio: Disconnected equalpower nodes for participant ${participantId}`);
    }
    
    getOutputNode(participantId: string): AudioNode | null {
        return this.gainNodes.get(participantId) || null;
    }
    
    updateGlobalSettings(settings: ISpatialAudioSettings): void {
        // Update listener position and orientation
        const listener = this.audioContext.listener;
        if (!listener) return;
        
        // Update listener position
        if ('positionX' in listener) {
            listener.positionX.value = settings.listenerPosition.x;
            listener.positionY.value = settings.listenerPosition.y;
            listener.positionZ.value = settings.listenerPosition.z || 1;
        } else {
            (listener as any).setPosition(
                settings.listenerPosition.x,
                settings.listenerPosition.y,
                settings.listenerPosition.z || 1
            );
        }
        
        // Update listener orientation
        if ('forwardX' in listener) {
            listener.forwardX.value = settings.listenerOrientation.forward.x;
            listener.forwardY.value = settings.listenerOrientation.forward.y;
            listener.forwardZ.value = settings.listenerOrientation.forward.z || -1;
            listener.upX.value = settings.listenerOrientation.up.x;
            listener.upY.value = settings.listenerOrientation.up.y;
            listener.upZ.value = settings.listenerOrientation.up.z || 1;
        } else {
            (listener as any).setOrientation(
                settings.listenerOrientation.forward.x,
                settings.listenerOrientation.forward.y,
                settings.listenerOrientation.forward.z || -1,
                settings.listenerOrientation.up.x,
                settings.listenerOrientation.up.y,
                settings.listenerOrientation.up.z || 1
            );
        }
        
        // Update master volume for all participants
        this.gainNodes.forEach((gainNode, participantId) => {
            gainNode.gain.value = settings.masterVolume;
        });
        
        console.log('SpatialAudio: Updated equalpower global settings');
    }
    
    destroy(): void {
        // Disconnect all nodes
        this.pannerNodes.forEach((panner, participantId) => {
            this.disconnectParticipant(participantId);
        });
        
        // Clear maps
        this.pannerNodes.clear();
        this.gainNodes.clear();
        
        console.log('SpatialAudio: Equalpower strategy destroyed');
    }
} 