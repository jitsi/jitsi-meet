export type Answer = {
    sender: string,
    pollId: number,
    answers: Array<boolean>
}

export type Poll = {
    id: number,
    sender: string,
    title: string,

    // options?: {
    //     multiple?: bool
    // },
    answers: Array<{ name: string, voters: Set<string> }>,
    messageIdx: number
};
