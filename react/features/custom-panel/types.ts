/**
 * Shape of the event envelope exchanged with the advisor app.
 *
 * Mirrors the style used by `modules/API`: a `name` field identifies the event
 * and any additional fields are event-specific payload.
 */
export interface ICustomPanelEvent {

    /**
     * Discriminator for the event, matched against the handler table.
     */
    name: string;

    /**
     * Additional event-specific fields are allowed.
     */
    [key: string]: unknown;
}

/**
 * Signature of an event handler registered in the table-driven dispatch map.
 */
export type EventHandler = (event: ICustomPanelEvent) => void;
