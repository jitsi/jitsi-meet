# Spatial Audio Debug Funktionalität

## Übersicht

Der erweiterte Spatial Audio Debug Button bietet eine umfassende Analyse der aktuellen Audio-Konfiguration in Jitsi Meet. Diese Funktionalität ist besonders nützlich beim Testen und Validieren der verschiedenen Audio-Modi und Teilnehmer-Positionierungen.

## Verwendung

### 1. Debug-Button in der Toolbar

- Öffne eine Jitsi-Konferenz
- Klicke auf das **Zahnrad-Symbol** (🔧) in der Toolbar
- Die Debug-Informationen werden in der Browser-Konsole ausgegeben

### 2. Programmatische Verwendung

```javascript
// Umfassende Debug-Ausgabe
SpatialAudioDebug.showComprehensiveDebug();

// Basis Debug-Informationen
SpatialAudioDebug.logCurrentState();

// Test-Teilnehmer hinzufügen
SpatialAudioDebug.addTestParticipants(8);

// Vollständiger Test aller Modi
SpatialAudioDebug.runFullTest();
```

## Debug-Ausgabe Struktur

### 1. **Aktueller Audio-Modus**
- Aktiver Modus (HRTF, Stereo, Equalpower, oder Deaktiviert)
- Status und AudioContext-Zustand
- Master Volume Einstellung

### 2. **Teilnehmerübersicht**
- Gesamtanzahl der Teilnehmer
- Anzahl der Remote-Teilnehmer
- Anzahl der Teilnehmer mit Audio-Streams

### 3. **Grid-Visualisierung**
```
🏗️ TEILNEHMER-GRID VISUALISIERUNG:

   ┌────────────────┬────────────────┬────────────────┐
   │ Teilnehmer A   │ Teilnehmer B   │ Teilnehmer C   │
   │ x:-2.0, y:1.0  │ x:0.0, y:1.0   │ x:2.0, y:1.0   │
   └────────────────┴────────────────┴────────────────┘

   ┌────────────────┬────────────────┬────────────────┐
   │ Teilnehmer D   │ Teilnehmer E   │ Teilnehmer F   │
   │ x:-2.0, y:-1.0 │ x:0.0, y:-1.0  │ x:2.0, y:-1.0  │
   └────────────────┴────────────────┴────────────────┘
```

### 4. **Detaillierte Teilnehmer-Informationen**
Für jeden Teilnehmer:
- Teilnehmer-ID und Display-Name
- Track Index
- Audio-Status (Stumm/Aktiv)
- Stream Source Verfügbarkeit
- 3D-Panner-Koordinaten (x, y, z)
- Verbindungsstatus
- Audio Element Details

### 5. **Technische Informationen**
- Aktuelle Panning-Strategie Details
- Listener-Konfiguration (Position und Orientierung)
- AudioContext Details (Sample Rate, Latenz, etc.)

## Audio-Modi

### **HRTF (Head-Related Transfer Function)**
- Vollständige 3D-Spatialisierung
- Realistische Kopf-bezogene Audiofilterung
- Beste Qualität für immersive Erfahrungen

### **Equalpower**
- 3D-Panning mit gleichmäßiger Energieverteilung
- Guter Kompromiss zwischen Qualität und Performance

### **Stereo**
- Einfaches Links-Rechts-Panning
- Niedrigste CPU-Last
- Funktioniert auf allen Geräten

### **None/Deaktiviert**
- Kein räumliches Audio
- Standard Mono/Stereo-Ausgabe

## Grid-Layout-Logik

Das System ordnet Teilnehmer automatisch in einem Grid an:

- **1-4 Teilnehmer**: Einzelne Reihe (y = 0)
- **5-8 Teilnehmer**: Zwei Reihen (y = ±1)
- **9-12 Teilnehmer**: Drei Reihen (y = ±1.5, 0)
- **>12 Teilnehmer**: Fallback auf einzelne Reihe

Horizontale Positionen werden gleichmäßig zwischen -2 und +2 verteilt.

## Fehlerbehebung

### Häufige Probleme:

1. **"Keine Teilnehmer mit Audio-Streams gefunden"**
   - Stelle sicher, dass andere Teilnehmer in der Konferenz sind
   - Überprüfe, ob Audio-Tracks korrekt geladen wurden

2. **"AudioContext is suspended"**
   - Führe `SpatialAudioDebug.resumeContext()` aus
   - Oder interagiere mit der Seite (Klick/Tastendruck)

3. **Button ist deaktiviert**
   - Spatial Audio muss aktiviert sein
   - Überprüfe die Konfiguration

## Beispiel-Ausgabe

```
🔊═══════════════════════════════════════════════════════════════════════════════════════
🔊 JITSI SPATIAL AUDIO DEBUG REPORT
🔊═══════════════════════════════════════════════════════════════════════════════════════

🎵 AKTUELLER AUDIO-MODUS:
   Modus: HRTF
   Status: ✅ Aktiviert
   AudioContext: running
   Master Volume: 100%

👥 TEILNEHMERÜBERSICHT:
   Gesamt: 4 Teilnehmer
   Remote: 3 Teilnehmer
   Mit Audio: 3 Teilnehmer

🏗️ TEILNEHMER-GRID VISUALISIERUNG:
   [ASCII Grid wird hier angezeigt]

🎧 DETAILLIERTE TEILNEHMER & AUDIO-STREAM INFORMATIONEN:
   [Detaillierte Informationen für jeden Teilnehmer]

⚙️ TECHNISCHE INFORMATIONEN:
   [AudioContext und Strategie-Details]
```

## Integration

Die Debug-Funktionalität ist vollständig in das bestehende Jitsi Meet System integriert und nutzt:

- Redux State für Teilnehmer-Informationen
- SpatialAudioManager für Audio-Konfiguration
- Bestehende Toolbar-Infrastruktur
- Analytics für Nutzungsstatistiken

## Entwicklung

Für weitere Anpassungen siehe:
- `react/features/toolbox/components/web/SpatialAudioDebugButton.tsx`
- `react/features/spatial-audio/debug.ts`
- `react/features/spatial-audio/SpatialAudioManager.ts`