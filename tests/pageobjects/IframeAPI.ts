import { LOG_PREFIX } from '../helpers/browserLogger';

import BasePageObject from './BasePageObject';

/**
 * The Iframe API and helpers from iframeAPITest.html
 */
export default class IframeAPI extends BasePageObject {
    /**
     * Returns the json object from the iframeAPI helper.
     * @param event
     */
    getEventResult(event: string): Promise<any> {
        return this.participant.execute(
            eventName => {
                const result = window.jitsiAPI.test[eventName];

                if (!result) {
                    return false;
                }

                return result;
            }, event);
    }

    /**
     * Clears the history of an event.
     * @param event
     */
    clearEventResults(event: string) {
        return this.participant.execute(
            eventName => {
                window.jitsiAPI.test[eventName] = undefined;
            }, event);
    }

    /**
     * Adds an event listener to the iframeAPI.
     * @param eventName The event name.
     */
    addEventListener(eventName: string) {
        return this.participant.execute(
            (event, prefix) => {
                console.log(`${new Date().toISOString()} ${prefix}iframeAPI - Adding listener for event: ${event}`);
                window.jitsiAPI.addListener(event, evt => {
                    console.log(
                        `${new Date().toISOString()} ${prefix}iframeAPI - Received ${event} event: ${JSON.stringify(evt)}`);
                    window.jitsiAPI.test[event] = evt;
                });
            }, eventName, LOG_PREFIX);
    }

    /**
     * Returns an array of available rooms and details of it.
     */
    getRoomsInfo() {
        return this.participant.execute(() => window.jitsiAPI.getRoomsInfo());
    }

    /**
     * Returns the number of participants in the conference.
     */
    getNumberOfParticipants() {
        return this.participant.execute(() => window.jitsiAPI.getNumberOfParticipants());
    }

    /**
     * Executes command using iframeAPI.
     * @param command The command.
     * @param args The arguments.
     */
    executeCommand(command: string, ...args: any[]) {
        return this.participant.execute(
            (commandName, commandArgs) =>
                window.jitsiAPI.executeCommand(commandName, ...commandArgs)
            , command, args);
    }

    /**
     * Returns the current state of the participant's pane.
     */
    isParticipantsPaneOpen() {
        return this.participant.execute(() => window.jitsiAPI.isParticipantsPaneOpen());
    }

    /**
     * Removes the embedded Jitsi Meet conference.
     */
    dispose() {
        return this.participant.execute(() => window.jitsiAPI.dispose());
    }

    /**
     * Invite the given participant to the meeting via PSTN.
     */
    invitePhone(value: string) {
        return this.participant.execute(v => window.jitsiAPI.invite([ {
            type: 'phone',
            number: v
        } ]), value);
    }

    /**
     * Invite the given participant to the meeting via sip (sip jibri).
     */
    inviteSIP(value: string) {
        return this.participant.execute(v => window.jitsiAPI.invite([ {
            type: 'sip',
            address: v
        } ]), value);
    }

    /**
     * Starts a file recording or streaming session.
     * @param options
     */
    startRecording(options: any) {
        return this.participant.execute(o => window.jitsiAPI.startRecording(o), options);
    }

    /**
     * Stop a file recording or streaming session.
     * @param mode
     */
    stopRecording(mode: string) {
        return this.participant.execute(m => window.jitsiAPI.stopRecording(m), mode);
    }

    /**
     * Returns the live-streaming url.
     */
    async getLivestreamUrl() {
        return this.participant.execute(() => window.jitsiAPI.getLivestreamUrl());
    }
}
