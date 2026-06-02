/**
 * TODO: move to ljm.
 */
export interface IIncomingAnswer {
    /**
     * An array of boolean: true if the answer was chosen by the responder, else false.
     */
    answers: Array<boolean>;

    /**
     * ID of the parent Poll of this answer.
     */
    pollId: string;

    /**
     * ID of the sender of this answer.
     */
    senderId: string;
}

/**
 * Extension of IIncomingAnswer with UI only fields.
 */
export interface IIncomingAnswerData extends IIncomingAnswer {
    /**
     * Name of the voter for this answer.
     */
    voterName: string;
}

/**
 * TODO: move to ljm and use it from there.
 */
export interface IPoll {

    /**
     * An array of answers:
     * the name of the answer name and a map of ids and names of voters voting for this option.
     */
    answers: Array<IAnswerData>;

    /**
     * The unique ID of this poll.
     */
    pollId: string;

    /**
     * The question asked by this poll.
     */
    question: string;

    /**
     * ID of the sender of this poll.
     */
    senderId: string | undefined;
}

/**
 * Extension of IPoll with UI only fields.
 */
export interface IPollData extends IPoll {
    /**
     * Whether the poll vote is being edited/changed. UI only, not stored on the backend.
     */
    changingVote: boolean;

    /**
     * Whether poll is in edit mode or not?.
     */
    editing: boolean;

    /**
     * The last sent votes for this poll, or null if voting was skipped
     * Note: This is reset when voting/skipping, not when clicking "Change vote".
     */
    lastVote: Array<boolean> | null;

    /**
     * Whether poll is saved or not?. UI only, not stored on the backend.
     */
    saved: boolean;

    /**
     * Whether the results should be shown instead of the answer form.
     * UI only, not stored on the backend.
     */
    showResults: boolean;
}

/**
 * TODO: move to ljm and use it from there.
 */
export interface IVoterData {
    /**
     * The id of the voter.
     */
    id: string;

    /**
     * Voter name if voter is not in the meeting.
     */
    name: string;
}

/**
 * TODO: move to ljm and use it from there.
 */
export interface IAnswerData {

    /**
     * The answer name chosen for the poll.
     */
    name: string;

    /**
     * An array of voters.
     */
    voters?: Array<IVoterData>;
}
