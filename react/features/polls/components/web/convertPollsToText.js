export const convertPollsToText = polls => {
  return Object.values(polls).reduce((previous, poll, index, arr) => {
      const voterSet = new Set();

      // Getting every voters ID that participates to the poll
      for (const answer of poll.answers) {
          for (const [ voterId ] of answer.voters) {
              voterSet.add(voterId);
          }
      }

      const totalVoters = voterSet.size;

      const { answers } = poll;

      answers.sort((a, b) => b.voters.size - a.voters.size);

      const answersText = answers
          .map((answer) => {
              const percentage = totalVoters === 0 ? 0 : Math.round(answer.voters.size / totalVoters * 100);              
              return `${answer.name}: ${answer.voters.size} (${percentage}%)
`;
          })
          .join("");

      const s = `${poll.question}

${answersText}
`;

      return previous.concat(s);
  }, "");
};