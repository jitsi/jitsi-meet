import { Participant } from '../helpers/Participant';
import { LOG_PREFIX } from '../helpers/browserLogger';

/**
 * The Iframe API and helpers from iframeAPITest.html
 */
export default class IframeAPI {
    private participant: Participant;

    /**
     * Initializes for a participant.
     * @param participant
     */
    constructor(participant: Participant) {
        this.participant = participant;
    }

    /**
     * Returns the json object from the iframeAPI helper.
     * @param event
     */
    async getEventResult(event: string): Promise<any> {
        return await this.participant.driver.execute(
            eventName => {
                const result = window.jitsiAPI.test[eventName];

                if (!result) {
                    return false;
                }

                return result;
            }, event);
    }

    /**
     * Adds an event listener to the iframeAPI.
     * @param eventName The event name.
     */
    async addEventListener(eventName: string) {
        return await this.participant.driver.execute(
            (event, prefix) => {
                console.log(`${new Date().toISOString()} ${prefix} Adding listener for event: ${event}`);
                window.jitsiAPI.addListener(event, evt => {
                    console.log(
                        `${new Date().toISOString()} ${prefix} Received ${event} event: ${JSON.stringify(evt)}`);
                    window.jitsiAPI.test[event] = evt;
                });
            }, eventName, LOG_PREFIX);
    }

    /**
     * Returns an array of available rooms and details of it.
     */
    async getRoomsInfo() {
        return await this.participant.driver.execute(() => window.jitsiAPI.getRoomsInfo());
    }

    /**
     * Returns the number of participants in the conference.
     */
    async getNumberOfParticipants() {
        return await this.participant.driver.execute(() => window.jitsiAPI.getNumberOfParticipants());
    }

    /**
     * Executes command using iframeAPI.
     * @param command The command.
     * @param args The arguments.
     */
    async executeCommand(command: string, ...args: any[]) {
        return await this.participant.driver.execute(
            (commandName, commandArgs) =>
                window.jitsiAPI.executeCommand(commandName, ...commandArgs)
            , command, args);
    }

    /**
     * Returns the current state of the participant's pane.
     */
    async isParticipantsPaneOpen() {
        return await this.participant.driver.execute(() => window.jitsiAPI.isParticipantsPaneOpen());
    }

    /**
     * Removes the embedded Jitsi Meet conference.
     */
    async dispose() {
        return await this.participant.driver.execute(() => window.jitsiAPI.dispose());
    }

}
