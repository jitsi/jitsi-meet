# Universal Translator Feature for Jitsi Meet

This feature provides real-time speech translation capabilities directly within Jitsi Meet meetings.

## Overview

The Universal Translator allows participants to:
- Translate speech from one language to another in real-time
- Compare multiple STT/TTS service providers for optimal latency
- Use BlackHole virtual audio device for seamless integration
- Monitor performance metrics for different service combinations

## Architecture

### Core Components
- **STT Providers**: Whisper (local), Groq, Deepgram, AssemblyAI
- **Translation Providers**: OpenAI GPT-4, Google Translate, Microsoft Translator
- **TTS Providers**: Cartesia Sonic, ElevenLabs, Deepgram Aura, Web Speech API
- **Audio Routing**: BlackHole virtual audio device integration

### Performance Targets
- Total end-to-end latency: <650ms
- STT processing: <300ms
- Translation: <200ms
- TTS generation: <100ms
- Audio routing: <50ms

## Usage

### Accessing the Feature
1. Click the translate button (🌐) in the Jitsi Meet toolbar
2. Configure your preferred service providers
3. Add API keys for external services
4. Select source and target languages
5. Start recording to begin real-time translation

### Service Configuration
The feature supports multiple providers for comparison:

**STT Services:**
- Whisper (Local) - Free, privacy-focused, ~200ms latency
- Groq Whisper - Ultra-fast, ~100ms latency
- Deepgram Nova-2 - Real-time streaming, ~100ms latency
- AssemblyAI Universal-2 - Highest accuracy, ~150ms latency

**TTS Services:**
- Cartesia Sonic - Ultra-low latency, ~40ms
- ElevenLabs - Highest quality, ~300ms latency
- Deepgram Aura - Streaming capable, ~400ms latency
- Web Speech API - Browser native, ~50ms latency

### API Key Requirements
External services require API keys:
- OpenAI (for GPT-4 translation)
- Groq (for ultra-fast STT)
- Deepgram (for STT and TTS)
- AssemblyAI (for high-accuracy STT)
- Cartesia (for low-latency TTS)
- ElevenLabs (for high-quality TTS)
- Azure/Google/Microsoft (for enterprise services)

## BlackHole Integration

For optimal audio routing on macOS:

1. Install BlackHole: https://existential.audio/blackhole/
2. Set BlackHole as your audio input device
3. The feature will automatically detect and use BlackHole for routing
4. Translated audio will be output through BlackHole for real-time playback

## Development

### Adding New Service Providers

1. Create provider class in appropriate service directory
2. Implement required interface methods
3. Add to provider factory
4. Update UI configuration options

### Testing Latency

The feature includes built-in latency monitoring:
- Individual service latencies
- End-to-end pipeline performance
- Success rate tracking
- Request count statistics

## Configuration

The feature can be configured via Jitsi Meet config:

```javascript
// config.js
const config = {
    // ... other config
    universalTranslator: {
        enabled: true,
        defaultSTTProvider: 'whisper',
        defaultTTSProvider: 'cartesia', 
        defaultTranslationProvider: 'openai',
        defaultSourceLanguage: 'en',
        defaultTargetLanguage: 'es'
    }
};
```

## Limitations

- Requires modern browser with MediaRecorder API
- External services require internet connection
- API costs apply for cloud-based providers
- BlackHole is macOS-only (fallback to default audio on other platforms)

## Future Enhancements

- Support for Windows virtual audio devices
- Additional language pairs
- Speaker identification
- Conversation history
- Export/sharing capabilities
- Integration with meeting recordings