/**
 * Command identifier for PDF presentation sharing over XMPP/muc or endpoint messages.
 */
export const PDF_PRESENTATION_COMMAND = 'pdf-presentation';

/**
 * Endpoint message event name for high-frequency PDF updates (page turns, pointer).
 */
export const PDF_ENDPOINT_MESSAGE_TYPE = 'pdf-presentation-event';

/**
 * Action statuses for PDF presentation command.
 */
export const PDF_PRESENTATION_STATUSES = {
    START: 'start',
    STOP: 'stop',
    UPDATE: 'update'
} as const;

/**
 * Display name for the PDF presentation participant.
 */
export const PDF_PRESENTATION_PARTICIPANT_NAME = 'PDF Presentation';

/**
 * Default laser pointer timeout in milliseconds before disappearing.
 */
export const LASER_POINTER_TIMEOUT_MS = 2500;
