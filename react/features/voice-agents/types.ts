/**
 * A voice agent (bot participant) as advertised through room metadata by the voice-agent prosody module.
 */
export interface IVoiceAgent {
    displayName?: string;

    /**
     * The metadata entry kind; always 'agent' for voice agents.
     */
    kind?: string;

    /**
     * The agent's synthetic audio source name (by convention `<agentId>-a0`). Subscribing to it is what
     * makes the agent audible.
     */
    sourceName?: string;
}

/**
 * The known voice agents, keyed by agent id.
 */
export interface IVoiceAgents {
    [agentId: string]: IVoiceAgent;
}
