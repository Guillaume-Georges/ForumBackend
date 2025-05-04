// controllers\pollController.js
const pollModel = require('../models/pollModel');


const getPoll = async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await pollModel.getFullPollById(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const votes = await pollModel.getVotesByPollId(id);

    // Attach voters to each option
    const optionsWithVoters = poll.options.map(option => {
      const voters = votes
        .filter(v => v.option_id === option.id)
        .map(v => ({ user_id: v.user_id, name: v.user_name }));

      return {
        ...option,
        voters,
      };
    });

    res.json({
      ...poll,
      options: optionsWithVoters,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not retrieve poll' });
  }
};


const createPoll = async (req, res) => {
    try {
      const { post_id, question, options, allowNewOptions = false } = req.body;
  
      if (!post_id || !question || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'Missing or invalid poll data' });
      }
  
      const pollId = await pollModel.createPoll(post_id, question, allowNewOptions);
      await pollModel.insertPollOptions(pollId, options);
  
      res.status(201).json({ message: 'Poll created', pollId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Poll creation failed' });
    }
  };
  

const updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, options, allowNewOptions } = req.body;

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Invalid question or options' });
    }

    const poll = await pollModel.getPollById(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (!poll.is_editable) {
      return res.status(403).json({ error: 'Poll is not editable' });
    }

    // Optional: verify ownership by user_id when auth is added

    await pollModel.updatePollQuestion(id, question, allowNewOptions);
    await pollModel.deletePollOptions(id);
    await pollModel.insertPollOptions(id, options);

    res.json({ message: 'Poll updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Poll update failed' });
  }
};


const deletePoll = async (req, res) => {
    try {
      const { id } = req.params;
  
      const poll = await pollModel.getPollById(id);
      if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }
  
      // Optional: add owner check when auth is ready
  
      await pollModel.deletePollVotes(id);     // remove all votes
      await pollModel.deletePollOptions(id);   // remove options
      await pollModel.deletePoll(id);          // finally remove the poll
  
      res.json({ message: 'Poll deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Poll deletion failed' });
    }
  };

  const unvotePoll = async (req, res) => {
    try {
      const { pollId } = req.params;
      const { user_id } = req.body;
  
      const vote = await pollModel.getUserVoteInPoll(pollId, user_id);
      if (!vote) {
        return res.status(400).json({ error: 'You have not voted in this poll' });
      }
  
      await pollModel.deleteVoteById(vote.id);
      await pollModel.decrementVoteCount(vote.poll_option_id);
  
      // Check if the option is now at 0 and is additional_option = true
      // Refetch the option after decrementing
      const updatedOption = await pollModel.getOptionById(vote.poll_option_id);

      if (updatedOption.vote_count <= 0 && updatedOption.additional_option) {
        await pollModel.deleteOptionById(updatedOption.id);
        console.log(`[backend] Deleted unused additional option ${updatedOption.id}`);
      }

  
      return res.json({ message: 'Vote removed successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to unvote' });
    }
  };
  

  const getAllVotesForPolls = async (req, res) => {
    try {
      const { poll_ids } = req.body;
  
      if (!Array.isArray(poll_ids) || poll_ids.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid poll_ids' });
      }
  
      const rows = await pollModel.getVotesForPollIds(poll_ids);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch votes for polls' });
    }
  };
  

  const votePoll = async (req, res) => {
    try {
      const { pollId } = req.params;
      const { user_id, option_id, new_option_text } = req.body;
  
      const poll = await pollModel.getPollWithOptions(pollId);
      if (!poll) return res.status(404).json({ error: 'Poll not found' });
      console.log(`[backend] Checking if user ${user_id} voted in poll ${pollId}`);

      const alreadyVoted = await pollModel.hasUserVoted(user_id, pollId);
      console.log(`[backend] hasUserVoted = ${alreadyVoted}`);

      if (alreadyVoted) {
        return res.status(403).json({ error: 'You have already voted in this poll' });
      }
  
      let finalOptionId = option_id;
  
      // If user wants to add a new option
      if (new_option_text) {
        if (!poll.more_option_enabled) {
          return res.status(403).json({ error: 'Adding new options is not allowed in this poll' });
        }
  
        finalOptionId = await pollModel.insertPollOption(pollId, new_option_text);
      }
  
      // If voting for existing option, validate it
      if (!finalOptionId) {
        return res.status(400).json({ error: 'Missing option ID or new option text' });
      }
  
      const option = await pollModel.getOptionById(finalOptionId);
      if (!option || option.poll_id != pollId) {
        return res.status(400).json({ error: 'Invalid option for this poll' });
      }
  
      // Record the vote
      await pollModel.recordVote(user_id, finalOptionId);
  
      res.json({ message: 'Vote recorded successfully', optionId: finalOptionId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Voting failed' });
    }
  };
  
  

module.exports = {
  updatePoll,
  createPoll,
  deletePoll,
  votePoll,
  getPoll,
  unvotePoll,
  getAllVotesForPolls,
};
