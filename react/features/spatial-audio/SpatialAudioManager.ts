import { 
    IPanningStrategy, 
    ILayoutStrategy, 
    ISpatialPosition, 
    ISpatialAudioSettings, 
    IParticipantAudioData, 
    SpatialAudioType,
    SpatialAudioEventType,
    SpatialAudioEventHandler,
    ISpatialAudioEvents
} from './types';

import { HRTFPanningStrategy } from './strategies/HRTFPanningStrategy';
import { StereoPanningStrategy } from './strategies/StereoPanningStrategy';
import { EqualpowerPanningStrategy } from './strategies/EqualpowerPanningStrategy';
import { NonePanningStrategy } from './strategies/NonePanningStrategy';
import { GridLayoutStrategy } from './layouts/GridLayoutStrategy';

/**
 * Central manager for spatial audio functionality
 * Handles participant management, strategy switching, and coordinate systems
 */
export class SpatialAudioManager {
    private static instance: SpatialAudioManager | null = null;
    
    private audioContext: AudioContext;
    private currentStrategy: IPanningStrategy;
    private layoutStrategy: ILayoutStrategy;
    private participants = new Map<string, IParticipantAudioData>();
    private settings: ISpatialAudioSettings;
    private eventListeners = new Map<SpatialAudioEventType, Set<SpatialAudioEventHandler<any>>>();
    
    private constructor() {
        // Initialize AudioContext
        this.audioContext = this.createAudioContext();
        
        // Initialize default settings
        this.settings = {
            enabled: false,
            type: 'none',
            masterVolume: 1.0,
            listenerPosition: { x: 0, y: 0, z: 1 },
            listenerOrientation: {
                forward: { x: 0, y: 0, z: -1 },
                up: { x: 0, y: 1, z: 0 }
            }
        };
        
        // Initialize strategies
        this.layoutStrategy = new GridLayoutStrategy();
        this.currentStrategy = new NonePanningStrategy(this.audioContext);
        
        console.log('SpatialAudioManager: Initialized with default settings');
    }
    
    /**
     * Get singleton instance
     */
    static getInstance(): SpatialAudioManager {
        if (!SpatialAudioManager.instance) {
            SpatialAudioManager.instance = new SpatialAudioManager();
        }
        return SpatialAudioManager.instance;
    }
    
    /**
     * Create or get existing AudioContext
     */
    private createAudioContext(): AudioContext {
        // Check if global context exists (for backward compatibility)
        if ((window as any).context) {
            console.log('SpatialAudioManager: Using existing global AudioContext');
            return (window as any).context;
        }
        
        // Create new AudioContext
        const context = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        (window as any).context = context; // Set global for backward compatibility
        console.log('SpatialAudioManager: Created new AudioContext');
        return context;
    }
    
    /**
     * Add event listener
     */
    addEventListener<T extends SpatialAudioEventType>(
        eventType: T, 
        handler: SpatialAudioEventHandler<T>
    ): void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }
        this.eventListeners.get(eventType)!.add(handler);
    }
    
    /**
     * Remove event listener
     */
    removeEventListener<T extends SpatialAudioEventType>(
        eventType: T, 
        handler: SpatialAudioEventHandler<T>
    ): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.delete(handler);
        }
    }
    
    /**
     * Emit event to all listeners
     */
    private emit<T extends SpatialAudioEventType>(
        eventType: T, 
        data: ISpatialAudioEvents[T]
    ): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`SpatialAudioManager: Error in event handler for ${eventType}:`, error);
                }
            });
        }
    }
    
    /**
     * Add or update a participant
     */
    addParticipant(participantData: Omit<IParticipantAudioData, 'position'>): void {
        const participantId = participantData.participantId;
        
        // Calculate position based on current participants
        const position = this.calculateParticipantPosition(participantData.trackIndex);
        
        const fullData: IParticipantAudioData = {
            ...participantData,
            position
        };
        
        // Store participant data
        this.participants.set(participantId, fullData);
        
        // Create audio nodes for this participant
        if (this.settings.enabled) {
            this.currentStrategy.createNodes(participantId);
            
            // Connect source if available
            if (fullData.source) {
                this.currentStrategy.connectSource(participantId, fullData.source);
            }
            
            // Set position
            this.currentStrategy.updatePosition(participantId, position);
        }
        
        console.log(`SpatialAudioManager: Added participant ${participantId} at position`, position);
        
        // Emit event
        this.emit('participantAdded', { participantId, position });
        
        // Recalculate all positions when participant count changes
        this.recalculateAllPositions();
    }
    
    /**
     * Remove a participant
     */
    removeParticipant(participantId: string): void {
        const participant = this.participants.get(participantId);
        if (!participant) {
            console.warn(`SpatialAudioManager: Participant ${participantId} not found for removal`);
            return;
        }
        
        // Disconnect audio nodes
        if (this.settings.enabled) {
            this.currentStrategy.disconnectParticipant(participantId);
        }
        
        // Remove from map
        this.participants.delete(participantId);
        
        console.log(`SpatialAudioManager: Removed participant ${participantId}`);
        
        // Emit event
        this.emit('participantRemoved', { participantId });
        
        // Recalculate all positions when participant count changes
        this.recalculateAllPositions();
    }
    
    /**
     * Connect audio source for a participant
     */
    connectParticipantSource(participantId: string, source: AudioNode): void {
        const participant = this.participants.get(participantId);
        if (!participant) {
            console.warn(`Spatial: Participant ${participantId} not found for source connection`);
            return;
        }
        
        console.log(`Spatial: Connecting source for ${participantId} - AudioContext state: ${this.audioContext.state}`);
        
        // Ensure AudioContext is running
        if (this.audioContext.state === 'suspended') {
            console.log(`Spatial: AudioContext is suspended, attempting to resume...`);
            this.audioContext.resume().then(() => {
                console.log(`Spatial: AudioContext resumed successfully`);
            }).catch(err => {
                console.error(`Spatial: Failed to resume AudioContext:`, err);
            });
        }
        
        // Update participant data
        participant.source = source;
        
        // Connect to current strategy if enabled
        if (this.settings.enabled) {
            console.log(`Spatial: Connecting to strategy ${this.currentStrategy.type} for participant ${participantId}`);
            this.currentStrategy.connectSource(participantId, source);
        } else {
            console.log(`Spatial: Not connecting to strategy - spatial audio disabled for participant ${participantId}`);
        }
        
        console.log(`Spatial: Source connection complete for participant ${participantId}`);
    }
    
    /**
     * Update participant mute status
     */
    updateParticipantMuteStatus(participantId: string, isMuted: boolean): void {
        const participant = this.participants.get(participantId);
        if (participant) {
            participant.isMuted = isMuted;
            console.log(`SpatialAudioManager: Updated mute status for ${participantId}: ${isMuted}`);
        }
    }
    
    /**
     * Calculate position for a participant based on their track index
     */
    private calculateParticipantPosition(trackIndex: number): ISpatialPosition {
        const participantCount = this.participants.size + 1; // +1 for the participant being added
        return this.layoutStrategy.getPositionForIndex(trackIndex, participantCount);
    }
    
    /**
     * Recalculate and update positions for all participants
     */
    private recalculateAllPositions(): void {
        const participantArray = Array.from(this.participants.values());
        const positions = this.layoutStrategy.calculatePositions(participantArray.length);
        
        participantArray.forEach((participant, index) => {
            const newPosition = positions[index];
            participant.position = newPosition;
            
            // Update position in current strategy if enabled
            if (this.settings.enabled) {
                this.currentStrategy.updatePosition(participant.participantId, newPosition);
            }
            
            // Emit event
            this.emit('participantMoved', { 
                participantId: participant.participantId, 
                position: newPosition 
            });
        });
        
        console.log(`SpatialAudioManager: Recalculated positions for ${participantArray.length} participants`);
    }
    
        /**
     * Switch spatial audio strategy
     */
    switchStrategy(newType: SpatialAudioType): void {
        // Check if we're already using the correct strategy (not just settings)
        if (newType === this.currentStrategy.type) {
            console.log(`SpatialAudioManager: Already using ${newType} strategy`);
            return;
        }

        const oldType = this.currentStrategy.type;

        // CRITICAL FIX: Disconnect all sources from old strategy before destroying it
        if (this.settings.enabled) {
            this.participants.forEach((participant, participantId) => {
                if (participant.source) {
                    console.log(`SpatialAudioManager: Disconnecting source for ${participantId} before strategy switch`);
                    participant.source.disconnect();
                }
            });
        }

        // Clean up current strategy
        this.currentStrategy.destroy();
        
        // Create new strategy
        switch (newType) {
            case 'hrtf':
                this.currentStrategy = new HRTFPanningStrategy(this.audioContext);
                break;
            case 'stereo':
                this.currentStrategy = new StereoPanningStrategy(this.audioContext);
                break;
            case 'equalpower':
                this.currentStrategy = new EqualpowerPanningStrategy(this.audioContext);
                break;
            case 'none':
            default:
                this.currentStrategy = new NonePanningStrategy(this.audioContext);
                break;
        }
        
        // Update settings
        this.settings.type = newType;
        
        // Recreate nodes for all participants if spatial audio is enabled
        if (this.settings.enabled) {
            this.participants.forEach((participant, participantId) => {
                // Create nodes
                this.currentStrategy.createNodes(participantId);
                
                // Connect source if available
                if (participant.source) {
                    this.currentStrategy.connectSource(participantId, participant.source);
                }
                
                // Set position
                this.currentStrategy.updatePosition(participantId, participant.position);
            });
            
            // Update global settings
            this.currentStrategy.updateGlobalSettings?.(this.settings);
        }
        
        console.log(`SpatialAudioManager: Switched from ${oldType} to ${newType} strategy`);
        
        // Emit event
        this.emit('strategyChanged', { oldType, newType });
    }
    
    /**
     * Enable or disable spatial audio
     */
    setEnabled(enabled: boolean): void {
        if (enabled === this.settings.enabled) {
            return;
        }
        
        this.settings.enabled = enabled;
        
        if (enabled) {
            // Enable spatial audio - create nodes for all participants
            this.participants.forEach((participant, participantId) => {
                this.currentStrategy.createNodes(participantId);
                
                if (participant.source) {
                    this.currentStrategy.connectSource(participantId, participant.source);
                }
                
                this.currentStrategy.updatePosition(participantId, participant.position);
            });
            
            this.currentStrategy.updateGlobalSettings?.(this.settings);
            console.log('SpatialAudioManager: Spatial audio enabled');
        } else {
            // Disable spatial audio - clean up all nodes
            this.participants.forEach((participant, participantId) => {
                this.currentStrategy.disconnectParticipant(participantId);
            });
            console.log('SpatialAudioManager: Spatial audio disabled');
        }
        
        // Emit settings update event
        this.emit('settingsUpdated', { settings: { ...this.settings } });
    }
    
    /**
     * Update global settings
     */
    updateSettings(newSettings: Partial<ISpatialAudioSettings>): void {
        const oldSettings = { ...this.settings };
        
        console.log(`SpatialAudioManager: Updating settings from`, oldSettings, `to`, newSettings);
        
        // Update settings object
        this.settings = { ...this.settings, ...newSettings };
        
        // Handle strategy change FIRST (before enable/disable)
        if (newSettings.type && newSettings.type !== oldSettings.type) {
            console.log(`SpatialAudioManager: Strategy change requested: ${oldSettings.type} -> ${newSettings.type}`);
            this.switchStrategy(newSettings.type);
        }
        
        // Handle enable/disable AFTER strategy change
        if (typeof newSettings.enabled === 'boolean' && newSettings.enabled !== oldSettings.enabled) {
            console.log(`SpatialAudioManager: Enable state change requested: ${oldSettings.enabled} -> ${newSettings.enabled}`);
            this.setEnabled(newSettings.enabled);
        }
        
        // Update strategy settings if enabled
        if (this.settings.enabled && this.currentStrategy.updateGlobalSettings) {
            this.currentStrategy.updateGlobalSettings(this.settings);
        }
        
        console.log('SpatialAudioManager: Settings updated', this.settings);
        console.log(`SpatialAudioManager: Current strategy type: ${this.currentStrategy.type}`);
        
        // Emit event
        this.emit('settingsUpdated', { settings: { ...this.settings } });
    }
    
    /**
     * Get current settings
     */
    getSettings(): ISpatialAudioSettings {
        return { ...this.settings };
    }
    
    /**
     * Get participant data
     */
    getParticipant(participantId: string): IParticipantAudioData | undefined {
        return this.participants.get(participantId);
    }
    
    /**
     * Get all participants
     */
    getAllParticipants(): IParticipantAudioData[] {
        return Array.from(this.participants.values());
    }
    
    /**
     * Get AudioContext
     */
    getAudioContext(): AudioContext {
        return this.audioContext;
    }
    
    /**
     * Clean up all resources
     */
    destroy(): void {
        // Clean up current strategy
        this.currentStrategy.destroy();
        
        // Clear participants
        this.participants.clear();
        
        // Clear event listeners
        this.eventListeners.clear();
        
        // Close audio context if we created it
        if (this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        // Clear singleton instance
        SpatialAudioManager.instance = null;
        
        console.log('SpatialAudioManager: Destroyed');
    }
}

// Export singleton getter for convenience
export const getSpatialAudioManager = () => SpatialAudioManager.getInstance(); 