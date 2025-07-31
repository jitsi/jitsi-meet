import { getSpatialAudioManager } from './index';
import { SpatialAudioType } from './types';

/**
 * Debug utilities for spatial audio system
 */
export class SpatialAudioDebug {
    static logCurrentState(): void {
        const manager = getSpatialAudioManager();
        const settings = manager.getSettings();
        const participants = manager.getAllParticipants();
        
        console.group('🔊 Spatial Audio Debug State');
        console.log('Settings:', settings);
        console.log('Participants:', participants.length);
        participants.forEach(p => {
            console.log(`  - ${p.displayName || p.participantId}: pos(${p.position.x}, ${p.position.y}), muted: ${p.isMuted}, hasSource: ${!!p.source}`);
        });
        console.log('AudioContext state:', manager.getAudioContext().state);
        console.groupEnd();
    }
    
    /**
     * Fügt Test-Teilnehmer hinzu für Debugging-Zwecke
     */
    static addTestParticipants(count: number = 8): void {
        const manager = getSpatialAudioManager();
        
        console.log(`🧪 Füge ${count} Test-Teilnehmer hinzu...`);
        
        for (let i = 0; i < count; i++) {
            const participantId = `test-participant-${i + 1}`;
            const displayName = `Test Participant ${i + 1}`;
            
            manager.addParticipant({
                participantId,
                displayName,
                isLocal: false,
                isMuted: false,
                trackIndex: i
            });
        }
        
        console.log(`✅ ${count} Test-Teilnehmer hinzugefügt`);
        this.logCurrentState();
    }
    
    /**
     * Entfernt alle Test-Teilnehmer
     */
    static removeTestParticipants(): void {
        const manager = getSpatialAudioManager();
        const participants = manager.getAllParticipants();
        
        console.log('🧹 Entferne alle Test-Teilnehmer...');
        
        participants.forEach(p => {
            if (p.participantId.startsWith('test-participant-')) {
                manager.removeParticipant(p.participantId);
            }
        });
        
        console.log('✅ Test-Teilnehmer entfernt');
        this.logCurrentState();
    }
    
    /**
     * Stellt den AudioContext wieder her, falls er suspended ist
     */
    static resumeContext(): void {
        const manager = getSpatialAudioManager();
        const context = manager.getAudioContext();
        
        if (context.state === 'suspended') {
            context.resume().then(() => {
                console.log('✅ AudioContext wiederhergestellt');
            }).catch(err => {
                console.error('❌ Fehler beim Wiederherstellen des AudioContext:', err);
            });
        } else {
            console.log(`ℹ️ AudioContext Status: ${context.state}`);
        }
    }
    
    /**
     * Führt einen kompletten Test aller Modi durch
     */
    static async runFullTest(): Promise<void> {
        console.group('🚀 Vollständiger Spatial Audio Test');
        
        // AudioContext prüfen und wiederherstellen
        this.resumeContext();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Test-Teilnehmer hinzufügen (jetzt standardmäßig 8 für Elevation-Tests)
        this.addTestParticipants();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Alle Modi testen
        const modes: SpatialAudioType[] = ['none', 'stereo', 'equalpower', 'hrtf'];
        
        for (const mode of modes) {
            console.log(`\n--- Teste Modus: ${mode.toUpperCase()} ---`);
            this._runTest(mode);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Playback Test für jeden Modus
            if (mode !== 'none') {
                console.log(`🎵 Playback Test für ${mode.toUpperCase()}...`);
                this.testPlayback();
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        console.log('\n✅ Vollständiger Test abgeschlossen');
        console.groupEnd();
    }
    
    static testHRTF(): void {
        const manager = getSpatialAudioManager();
        console.log('🧪 Testing HRTF...');
        console.log('Before update - Current strategy type:', (manager as any).currentStrategy.type);
        manager.updateSettings({ enabled: true, type: 'hrtf' });
        console.log('After update - Current strategy type:', (manager as any).currentStrategy.type);
        
        // Check audio elements
        const audioElements = document.querySelectorAll('audio[id*="remoteAudio"]');
        console.log(`Found ${audioElements.length} audio elements:`);
        audioElements.forEach((audio, index) => {
            const element = audio as HTMLAudioElement;
            console.log(`  Audio ${index + 1}: volume=${element.volume}, muted=${element.muted}, paused=${element.paused}`);
        });
        
        setTimeout(() => this.logCurrentState(), 100);
    }
    
    static testStereo(): void {
        const manager = getSpatialAudioManager();
        console.log('🧪 Testing Stereo...');
        manager.updateSettings({ enabled: true, type: 'stereo' });
        setTimeout(() => this.logCurrentState(), 100);
    }
    
    static testEqualpower(): void {
        const manager = getSpatialAudioManager();
        console.log('🧪 Testing Equalpower...');
        manager.updateSettings({ enabled: true, type: 'equalpower' });
        setTimeout(() => this.logCurrentState(), 100);
    }
    
    static testNone(): void {
        this._runTest('none');
    }

    /**
     * PLAYS A TEST TONE from the position of each participant to verify spatialization.
     * This creates a temporary audio graph and does not interrupt the main audio.
     */
    static testPlayback(): void {
        const manager = getSpatialAudioManager();
        const context = manager.getAudioContext();
        // @ts-ignore
        const strategy = manager.currentStrategy;
        const participants = manager.getAllParticipants();

        if (participants.length === 0) {
            console.warn('❌ Keine Teilnehmer gefunden. Führe zuerst `SpatialAudioDebug.addTestParticipants()` aus.');
            return;
        }

        if (context.state === 'suspended') {
            console.warn('❌ AudioContext ist suspended. Führe zuerst `SpatialAudioDebug.resumeContext()` aus.');
            return;
        }

        console.group(`⏯️ Testing Playback for Current Strategy: ${strategy.type.toUpperCase()}`);

        // Create alternating playback order: 1, 5, 2, 6, 3, 7, 4, 8 (alternates between upper and lower row)
        const playbackOrder: number[] = [];
        const halfCount = Math.ceil(participants.length / 2);
        
        for (let i = 0; i < halfCount; i++) {
            playbackOrder.push(i); // Add participant from first half (upper row)
            if (i + halfCount < participants.length) {
                playbackOrder.push(i + halfCount); // Add corresponding participant from second half (lower row)
            }
        }

        console.log(`🎵 Playback-Reihenfolge: ${playbackOrder.map(i => i + 1).join(', ')} (alterniert zwischen oberer und unterer Reihe)`);

        playbackOrder.forEach((participantIndex, playIndex) => {
            const p = participants[participantIndex];
            
            // Stagger the playback for each participant
            setTimeout(() => {
                const pos = p.position;
                console.log(`🔊 Spiele Ton für: ${p.displayName || p.participantId} bei Position (x:${pos.x.toFixed(2)}, y:${pos.y.toFixed(2)}, z:${pos.z?.toFixed(2)})`);

                const osc = context.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 440; // Gleicher Ton für alle Teilnehmer

                const gain = context.createGain();
                gain.gain.value = 0.3; // Use a safe volume to avoid clipping

                // This is our temporary audio chain
                let lastNode: AudioNode = gain;

                // --- Build a temporary graph that mimics the active strategy ---
                if (strategy.type === 'hrtf' || strategy.type === 'equalpower') {
                    const panner = context.createPanner();
                    panner.panningModel = strategy.type === 'hrtf' ? 'HRTF' : 'equalpower';
                    panner.distanceModel = 'inverse';
                    panner.refDistance = 1;
                    panner.maxDistance = 10000;
                    panner.rolloffFactor = 0; // Crucially, disable distance attenuation for the test
                    panner.coneInnerAngle = 360;
                    panner.coneOuterAngle = 360;

                    if (panner.positionX) {
                        panner.positionX.value = pos.x;
                        panner.positionY.value = pos.y;
                        panner.positionZ.value = pos.z || 0;
                    } else {
                        panner.setPosition(pos.x, pos.y, pos.z || 0);
                    }
                    
                    gain.connect(panner);
                    lastNode = panner;

                } else if (strategy.type === 'stereo') {
                    const stereoPanner = context.createStereoPanner();
                    // Pan value should be between -1 (left) and 1 (right). We'll simulate it based on X.
                    stereoPanner.pan.value = Math.max(-1, Math.min(1, pos.x / 5.0));
                    
                    gain.connect(stereoPanner);
                    lastNode = stereoPanner;
                }
                // For 'none', we just connect gain directly.

                osc.connect(gain);
                lastNode.connect(context.destination);

                // Play the tone for a short duration
                const now = context.currentTime;
                osc.start(now);
                osc.stop(now + 0.5);

                // Clean up the temporary nodes after the sound has finished playing
                osc.onended = () => {
                    osc.disconnect();
                    gain.disconnect();
                    if (lastNode !== gain) {
                        lastNode.disconnect();
                    }
                };

            }, playIndex * 600); // Use playIndex for timing, not participantIndex
        });

        setTimeout(() => {
            console.groupEnd();
        }, playbackOrder.length * 600);
    }

    /**
     * Runs a standardized test for a specific audio mode.
     */
    private static _runTest(mode: SpatialAudioType): void {
        const manager = getSpatialAudioManager();
        const isEnabled = mode !== 'none';
        
        console.group(`🧪 Testing Mode: ${mode.toUpperCase()}`);
        console.log('--- BEFORE ---');
        this.logCurrentState();

        console.log(`--- ACTION: Applying settings { enabled: ${isEnabled}, type: '${mode}' } ---`);
        manager.updateSettings({ enabled: isEnabled, type: mode });
        
        // Use setTimeout to allow state updates to propagate through the system
        setTimeout(() => {
            console.log('--- AFTER (100ms) ---');
            this.logCurrentState();
            console.groupEnd();
        }, 100);
    }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).SpatialAudioDebug = SpatialAudioDebug;
} 