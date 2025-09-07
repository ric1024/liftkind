import React, { useState, useEffect } from "react";
import "./VoteButton.css";

export default function VoteButton({ requestId }) {
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(0);

  // Load vote status & count from localStorage or backend
  useEffect(() => {
    const storedVotes = JSON.parse(localStorage.getItem("votes")) || {};
    const voteCount = JSON.parse(localStorage.getItem("voteCounts")) || {};
    setVoted(storedVotes[requestId] || false);
    setVotes(voteCount[requestId] || 0);
  }, [requestId]);

  const handleVote = () => {
    const storedVotes = JSON.parse(localStorage.getItem("votes")) || {};
    const voteCount = JSON.parse(localStorage.getItem("voteCounts")) || {};

    if (!storedVotes[requestId]) {
      storedVotes[requestId] = true;
      voteCount[requestId] = (voteCount[requestId] || 0) + 1;

      localStorage.setItem("votes", JSON.stringify(storedVotes));
      localStorage.setItem("voteCounts", JSON.stringify(voteCount));

      setVoted(true);
      setVotes(voteCount[requestId]);
    }
  };

  return (
    <div className="vote-wrapper">
      <button
        className={`vote-button ${voted ? "voted" : ""}`}
        onClick={handleVote}
        disabled={voted}
      >
        {voted ? "Voted ✅" : "Vote to Support"}
      </button>
      <p className="vote-count">Votes: {votes}</p>
    </div>
  );
}