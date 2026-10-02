/**
 * The provisioning lifecycle of a voice agent, as reported by the prosody module. Only an `active` agent is
 * mirrored into the room; the rest have no media leg yet, or never will.
 */
export type VoiceAgentState = 'provisioning' | 'connecting' | 'active' | 'failed' | 'ended';

/**
 * A voice agent (bot participant) as advertised through room metadata by the voice-agent prosody module.
 */
export interface IVoiceAgent {
    displayName?: string;

    /**
     * The agent's synthetic audio source name (by convention `<agentId>-a0`). Subscribing to it is what
     * makes the agent audible.
     */
    sourceName?: string;

    /** The agent's lifecycle state. Absent on older deployments, which is treated as present. */
    state?: VoiceAgentState;
}

/**
 * The known voice agents, keyed by agent id.
 */
export interface IVoiceAgents {
    [agentId: string]: IVoiceAgent;
}
