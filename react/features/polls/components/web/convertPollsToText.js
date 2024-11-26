export const convertPollsToText = (polls, t) => {
  return polls.reduce((previous, poll, index, arr) => {
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
     
      const text = []

      text.push(poll.question)
      text.push('\r\n')
      if (poll.creatorName) {
        text.push(t("polls.download.by", {name: poll.creatorName}))
        text.push('\r\n')
      }
      text.push('\r\n')

      answers.forEach(answer => {
        const percentage = totalVoters === 0 ? 0 : Math.round(answer.voters.size / totalVoters * 100);
        text.push(`${answer.name}: ${answer.voters.size} (${percentage}%)`)
        text.push('\r\n')
        Array.from(answer.voters).forEach(([ id, name ]) => {
          text.push(name)
          text.push('\r\n')
        })
        text.push('\r\n')
      });
      text.push('\r\n')

      return previous.concat(text.join(""));
  }, "");
};
