# Spatial Audio Manager System

Das **SpatialAudioManager System** ist eine vollständige Neuimplementierung der räumlichen Audio-Funktionalität in Jitsi Meet. Es löst das ursprüngliche Problem, dass PannerNodes für HRTF Audio erst erkannt werden, wenn sich Teilnehmer entmutet haben.

## 🎯 Hauptziele

1. **Zentralisierte Verwaltung**: Ein einziges System verwaltet alle räumlichen Audio-Funktionen
2. **Frühzeitige Registrierung**: Teilnehmer werden sofort registriert, unabhängig vom Mute-Status
3. **Mehrere Audio-Strategien**: Unterstützung für HRTF, Stereo, Equalpower und Mono
4. **Erweiterbarkeit**: Einfache Integration neuer Audio-Strategien
5. **Event-System**: Reaktive Updates bei Änderungen

## 🏗️ Architektur

### Strategy Pattern
Das System verwendet das Strategy Pattern für verschiedene Audio-Verarbeitungsstrategien:

- **HRTFPanningStrategy**: 3D-Audio mit Head-Related Transfer Function
- **StereoPanningStrategy**: Einfaches Links-Rechts-Panning
- **EqualpowerPanningStrategy**: Gleichmäßige Leistungsverteilung
- **NonePanningStrategy**: Mono-Audio ohne räumliche Effekte

### Layout-Strategien
- **GridLayoutStrategy**: Automatische Positionierung in Raster-Layout (1-3 Reihen)

### Zentraler Manager
- **SpatialAudioManager**: Singleton-Klasse, die alle Funktionen koordiniert

## 🚀 Verwendung

### Grundlegende Einrichtung

```typescript
import { getSpatialAudioManager } from 'react/features/spatial-audio';

// Manager-Instanz abrufen
const manager = getSpatialAudioManager();

// Teilnehmer registrieren
manager.addParticipant({
    participantId: 'participant-123',
    displayName: 'Max Mustermann',
    isLocal: false,
    isMuted: false,
    trackIndex: 0
});

// Audio-Quelle verbinden
manager.connectParticipantSource('participant-123', audioSourceNode);

// Spatial Audio aktivieren
manager.setEnabled(true);

// Strategie wechseln
manager.switchStrategy('hrtf');
```

### Redux Integration

```typescript
import { 
    enableSpatialAudio, 
    setSpatialAudioType, 
    toggleSpatialAudio 
} from 'react/features/spatial-audio';

// In einer React-Komponente
dispatch(enableSpatialAudio());
dispatch(setSpatialAudioType('hrtf'));
dispatch(toggleSpatialAudio());
```

### React-Komponente

```typescript
import { SpatialAudioControls } from 'react/features/spatial-audio';

function MyComponent() {
    return (
        <div>
            <SpatialAudioControls />
        </div>
    );
}
```

## 📋 API-Referenz

### SpatialAudioManager

#### Hauptmethoden
- `addParticipant(data)`: Teilnehmer registrieren
- `removeParticipant(participantId)`: Teilnehmer entfernen
- `connectParticipantSource(participantId, source)`: Audio-Quelle verbinden
- `setEnabled(enabled)`: Spatial Audio aktivieren/deaktivieren
- `switchStrategy(type)`: Audio-Strategie wechseln
- `updateSettings(settings)`: Einstellungen aktualisieren

#### Event-System
```typescript
manager.addEventListener('participantAdded', (data) => {
    console.log('Teilnehmer hinzugefügt:', data.participantId);
});

manager.addEventListener('strategyChanged', (data) => {
    console.log('Strategie geändert:', data.oldType, '->', data.newType);
});
```

### Audio-Strategien

#### HRTF (Head-Related Transfer Function)
- **Typ**: `'hrtf'`
- **Beschreibung**: Realistische 3D-Audio-Simulation
- **Verwendet**: PannerNode mit HRTF-Modell
- **Beste für**: Immersive Konferenzen, Gaming

#### Stereo Panning
- **Typ**: `'stereo'`
- **Beschreibung**: Einfaches Links-Rechts-Panning
- **Verwendet**: StereoPannerNode
- **Beste für**: Einfache räumliche Trennung

#### Equalpower Panning
- **Typ**: `'equalpower'`
- **Beschreibung**: Gleichmäßige Leistungsverteilung
- **Verwendet**: PannerNode mit Equalpower-Modell
- **Beste für**: Ausgewogene Audio-Verteilung

#### None (Mono)
- **Typ**: `'none'`
- **Beschreibung**: Kein räumliches Audio
- **Verwendet**: Nur GainNode
- **Beste für**: Einfache Konferenzen, Bandbreiten-Optimierung

## 🔧 Konfiguration

### Standard-Einstellungen
```typescript
const defaultSettings = {
    enabled: false,
    type: 'none',
    masterVolume: 1.0,
    listenerPosition: { x: 0, y: 0, z: 1 },
    listenerOrientation: {
        forward: { x: 0, y: 0, z: -1 },
        up: { x: 0, y: 1, z: 0 }
    }
};
```

### Layout-Konfiguration
Das Grid-Layout positioniert Teilnehmer automatisch:

- **1-4 Teilnehmer**: Eine Reihe (Y = 0)
- **5-8 Teilnehmer**: Zwei Reihen (Y = ±1)
- **9-12 Teilnehmer**: Drei Reihen (Y = -1.5, 0, +1.5)
- **>12 Teilnehmer**: Horizontale Linie (Y = 0)

## 🔄 Migration von der alten AudioTrack-Implementierung

### Vorher (Alte Implementierung)
```typescript
// Komplexe manuelle Verwaltung in AudioTrack
setupSpatial();
updateSpatial();
checkAndRecalculatePositions();
```

### Nachher (Neues System)
```typescript
// Automatische Verwaltung durch SpatialAudioManager
const manager = getSpatialAudioManager();
manager.addParticipant(participantData);
// Alles andere läuft automatisch
```

### Rückwärtskompatibilität
Die alte AudioTrack-Komponente wurde so angepasst, dass sie das neue System verwendet, aber die gleiche API beibehält. Legacy-Methoden geben Warnungen aus und leiten an das neue System weiter.

## 🐛 Debugging

### Logging
Das System gibt ausführliche Logs aus:
```
SpatialAudioManager: Initialized with default settings
SpatialAudioManager: Added participant Max Mustermann at position {x: -1, y: 0, z: 0}
SpatialAudio: Created HRTF nodes for participant participant-123
```

### Debug-Komponente
Die `SpatialAudioControls`-Komponente zeigt:
- Aktuellen Status
- Teilnehmer-Positionen
- Audio-Context-Zustand
- Strategie-Informationen

## 🎨 Erweiterungen

### Neue Audio-Strategie hinzufügen

1. **Interface implementieren**:
```typescript
class MyCustomStrategy implements IPanningStrategy {
    readonly type = 'custom';
    
    createNodes(participantId: string): AudioNode[] {
        // Implementierung
    }
    
    // Weitere Methoden...
}
```

2. **In Manager registrieren**:
```typescript
// In SpatialAudioManager.switchStrategy()
case 'custom':
    this.currentStrategy = new MyCustomStrategy(this.audioContext);
    break;
```

### Neue Layout-Strategie hinzufügen

```typescript
class CircleLayoutStrategy implements ILayoutStrategy {
    calculatePositions(participantCount: number): ISpatialPosition[] {
        // Kreisförmige Anordnung implementieren
    }
}
```

## 🔒 Sicherheit und Performance

### Ressourcen-Management
- Automatische Bereinigung bei Komponenten-Unmount
- Singleton-Pattern verhindert Mehrfachinstanziierung
- Event-Listener werden ordnungsgemäß entfernt

### Performance-Optimierungen
- Lazy Loading von Audio-Nodes
- Batch-Updates für Positionsänderungen
- Effiziente Event-Weiterleitung

## 📱 Browser-Kompatibilität

Das System unterstützt moderne und ältere Browser:
- **Moderne Browser**: Verwenden neue Web Audio API
- **Ältere Browser**: Fallback auf Legacy-Methoden
- **Automatische Erkennung**: System wählt beste verfügbare API

## 🤝 Beitragen

Neue Strategien, Layout-Algorithmen oder Verbesserungen sind willkommen. Das modulare Design macht Erweiterungen einfach und sicher.

---

**Entwickelt für Jitsi Meet - Spatial Audio Enhancement** 