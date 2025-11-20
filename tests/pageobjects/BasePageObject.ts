import { Participant } from '../helpers/Participant';

/**
 * Represents the base page object.
 * All page object has the current participant (holding the driver/browser session).
 */
export default class BasePageObject {
    participant: Participant;

    /**
     * Represents the base page object.
     */
    constructor(participant: Participant) {
        this.participant = participant;
    }
}
