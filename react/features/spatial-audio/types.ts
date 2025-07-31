/**
 * Types and interfaces for the Spatial Audio Manager system
 */

export type SpatialAudioType = 'hrtf' | 'stereo' | 'equalpower' | 'none';

export interface ISpatialPosition {
    x: number;
    y: number;
    z?: number;
}

export interface IParticipantAudioData {
    participantId: string;
    displayName?: string;
    source?: AudioNode;
    isLocal: boolean;
    isMuted: boolean;
    position: ISpatialPosition;
    trackIndex: number;
}

/**
 * Interface for different panning strategies
 */
export interface IPanningStrategy {
    /**
     * The type identifier for this strategy
     */
    readonly type: SpatialAudioType;
    
    /**
     * Create audio nodes for a participant
     */
    createNodes(participantId: string): AudioNode[];
    
    /**
     * Update the spatial position for a participant
     */
    updatePosition(participantId: string, position: ISpatialPosition): void;
    
    /**
     * Connect a source to the spatial audio chain
     */
    connectSource(participantId: string, source: AudioNode): void;
    
    /**
     * Disconnect a participant's audio chain
     */
    disconnectParticipant(participantId: string): void;
    
    /**
     * Get the final output node for a participant (usually GainNode)
     */
    getOutputNode(participantId: string): AudioNode | null;
    
    /**
     * Clean up all resources for this strategy
     */
    destroy(): void;
    
    /**
     * Update global settings (volume, etc.)
     */
    updateGlobalSettings?(settings: ISpatialAudioSettings): void;
}

export interface ISpatialAudioSettings {
    enabled: boolean;
    type: SpatialAudioType;
    masterVolume: number;
    listenerPosition: ISpatialPosition;
    listenerOrientation: {
        forward: ISpatialPosition;
        up: ISpatialPosition;
    };
}

export interface ILayoutStrategy {
    /**
     * Calculate positions for all participants
     */
    calculatePositions(participantCount: number): ISpatialPosition[];
    
    /**
     * Get position for a specific participant index
     */
    getPositionForIndex(index: number, totalCount: number): ISpatialPosition;
}

/**
 * Events emitted by the SpatialAudioManager
 */
export interface ISpatialAudioEvents {
    participantAdded: { participantId: string; position: ISpatialPosition };
    participantRemoved: { participantId: string };
    participantMoved: { participantId: string; position: ISpatialPosition };
    strategyChanged: { oldType: SpatialAudioType; newType: SpatialAudioType };
    settingsUpdated: { settings: ISpatialAudioSettings };
}

export type SpatialAudioEventType = keyof ISpatialAudioEvents;
export type SpatialAudioEventHandler<T extends SpatialAudioEventType> = (
    data: ISpatialAudioEvents[T]
) => void; 