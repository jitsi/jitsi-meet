// @flow

export type Answer = {
    senderId: string,
    pollId: number,
    answers: Array<boolean>
};

export type Poll = {
    senderId: string,
    question: string,
    answers: Array<{ name: string, voters: Set<string> }>,
};
