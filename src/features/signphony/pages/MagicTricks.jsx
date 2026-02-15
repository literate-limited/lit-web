/**
 * Magic Tricks Page
 */

import React, { useState, useEffect } from 'react';
import { useSignphony } from '../hooks/useSignphony';

const MagicTricks = () => {
  const { api } = useSignphony();
  const [tricks, setTricks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTricks();
  }, []);

  const loadTricks = async () => {
    try {
      const data = await api.getMagicTricks();
      setTricks(data.tricks || []);
    } catch (error) {
      console.error('Failed to load tricks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="magic-tricks">
      <h1>✨ Magic Tricks</h1>
      <p>Train hand dexterity with magic trick tutorials</p>

      {loading && <p>Loading tricks...</p>}

      {!loading && (
        <div className="tricks-grid">
          {tricks.map((trick) => (
            <div key={trick.id} className="trick-card">
              <h3>{trick.name}</h3>
              <p>{trick.description}</p>
              <button>Practice This Trick</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MagicTricks;
