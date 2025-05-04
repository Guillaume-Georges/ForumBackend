const db = require('../connection/db');

const getPollById = async (pollId) => {
  const [rows] = await db.execute(
    `SELECT * FROM polls WHERE id = ?`,
    [pollId]
  );
  return rows[0];
};

const updatePollQuestion = async (pollId, question, allowNewOptions) => {
    await db.execute(
      `UPDATE polls SET question = ?, more_option_enabled = ? WHERE id = ?`,
      [question, allowNewOptions, pollId]
    );
  };
  

const deletePollOptions = async (pollId) => {
  await db.execute(
    `DELETE FROM poll_options WHERE poll_id = ?`,
    [pollId]
  );
};

const insertPollOptions = async (pollId, options) => {
  const values = options.map(option => [pollId, option]);
  await db.query(
    `INSERT INTO poll_options (poll_id, option_text) VALUES ?`,
    [values]
  );
};

const createPoll = async (post_id, question, allowNewOptions) => {
    const [pollResult] = await db.execute(
      `INSERT INTO polls (post_id, question, is_editable, more_option_enabled) VALUES (?, ?, ?, ?)`,
      [post_id, question, true, allowNewOptions]
    );
    return pollResult.insertId;
  };

  const deletePollVotes = async (pollId) => {
    await db.execute(
      `DELETE pv FROM poll_votes pv
       JOIN poll_options po ON pv.poll_option_id = po.id
       WHERE po.poll_id = ?`,
      [pollId]
    );
  };
  
  
  const deletePoll = async (pollId) => {
    await db.execute(
      `DELETE FROM polls WHERE id = ?`,
      [pollId]
    );
  };
  
  const getPollWithOptions = async (pollId) => {
    const [poll] = await db.execute(`SELECT * FROM polls WHERE id = ?`, [pollId]);
    return poll[0];
  };
  
  const getOptionById = async (optionId) => {
    const [rows] = await db.execute(
      `SELECT * FROM poll_options WHERE id = ?`,
      [optionId]
    );
    return rows[0];
  };
  
  const insertPollOption = async (pollId, optionText) => {
    const [result] = await db.execute(
      `INSERT INTO poll_options (poll_id, option_text, additional_option) VALUES (?, ?, TRUE)`,
      [pollId, optionText]
    );
    return result.insertId;
  };
  
  
  const hasUserVoted = async (userId, pollId) => {
    const [rows] = await db.execute(
      `SELECT pv.id FROM poll_votes pv
       JOIN poll_options po ON pv.poll_option_id = po.id
       WHERE pv.user_id = ? AND po.poll_id = ?`,
      [userId, pollId]
    );
    return rows.length > 0;
  };
  
  const recordVote = async (userId, optionId) => {
    await db.execute(
      `INSERT INTO poll_votes (user_id, poll_option_id) VALUES (?, ?)`,
      [userId, optionId]
    );
    await db.execute(
      `UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = ?`,
      [optionId]
    );
  };

  const getFullPollById = async (pollId) => {
    const [pollRows] = await db.execute(
      `SELECT id, post_id, question, is_editable, more_option_enabled FROM polls WHERE id = ?`,
      [pollId]
    );
  
    if (pollRows.length === 0) return null;
  
    const poll = pollRows[0];
  
    const [options] = await db.execute(
      `SELECT id, option_text, vote_count FROM poll_options WHERE poll_id = ?`,
      [pollId]
    );
  
    poll.options = options;
    return poll;
  };

  const getVotesByPollId = async (pollId) => {
    const [rows] = await db.execute(
      `SELECT 
        po.id AS option_id,
        u.id AS user_id,
        u.name AS user_name
       FROM poll_votes pv
       JOIN poll_options po ON pv.poll_option_id = po.id
       JOIN users u ON pv.user_id = u.id
       WHERE po.poll_id = ?`,
      [pollId]
    );
  
    return rows;
  };

  // Used in unvotePoll
async function getUserVoteInPoll(pollId, userId) {
  const [rows] = await db.execute(`
    SELECT pv.id, pv.poll_option_id
    FROM poll_votes pv
    JOIN poll_options po ON pv.poll_option_id = po.id
    WHERE po.poll_id = ? AND pv.user_id = ?
  `, [pollId, userId]);
  return rows[0]; // or undefined if not voted
}

async function deleteVoteById(voteId) {
  return db.execute(`DELETE FROM poll_votes WHERE id = ?`, [voteId]);
}

async function decrementVoteCount(optionId) {
  return db.execute(`UPDATE poll_options SET vote_count = vote_count - 1 WHERE id = ?`, [optionId]);
}

// Used in getAllVotesForPolls
async function getVotesForPollIds(pollIds) {
  const placeholders = pollIds.map(() => '?').join(',');
  const [rows] = await db.execute(`
    SELECT 
      po.poll_id,
      pv.poll_option_id AS option_id,
      u.id AS user_id,
      u.name AS user_name,
      u.profile_image
    FROM poll_votes pv
    JOIN poll_options po ON pv.poll_option_id = po.id
    JOIN users u ON pv.user_id = u.id
    WHERE po.poll_id IN (${placeholders})
  `, pollIds);
  return rows;
}

const deleteOptionById = async (optionId) => {
  await db.execute(`DELETE FROM poll_options WHERE id = ?`, [optionId]);
};

  
  
  


module.exports = {
  getPollById,
  updatePollQuestion,
  deletePollOptions,
  insertPollOptions,
  createPoll,
  deletePoll,
  deletePollVotes,
  getPollWithOptions,
  getOptionById,
  insertPollOption,
  hasUserVoted,
  recordVote,
  getFullPollById,
  getVotesByPollId,
  getVotesForPollIds,
  decrementVoteCount,
  deleteVoteById,
  getUserVoteInPoll,
  deleteOptionById,
};
