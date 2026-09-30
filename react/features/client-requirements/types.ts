/**
 * A capability that this client does not advertise, but the deployment requires.
 */
export interface IMissingFeature {

    /**
     * Text (in English) from the server, which describes how to add support for the capability.
     */
    details?: string;

    /**
     * The XMPP feature (the disco#info "var"), e.g. "http://jitsi.org/ssrc-rewriting-1".
     */
    feature: string;

    /**
     * How severe the missing capability is. With 'hard' the client is not invited to the conference.
     */
    level: string;

    /**
     * A stable symbolic name for the capability, e.g. "SSRC_REWRITING_V1". Used as a translation key.
     */
    name?: string;

    /**
     * A URL with more information.
     */
    url?: string;
}

/**
 * The capabilities that this client is missing, and what the server did about it.
 */
export interface IClientRequirements {

    /**
     * Either 'reject' (this client is not invited to the conference, i.e. it can not send or receive media) or 'warn'.
     */
    action: string;

    /**
     * The capabilities that this client does not advertise.
     */
    features: IMissingFeature[];
}
