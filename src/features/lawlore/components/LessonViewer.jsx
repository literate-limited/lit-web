import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../../api';
import styles from '../styles/lawlore.module.css';
import ReactMarkdown from 'react-markdown';

export default function LessonViewer() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLesson();
  }, [levelId]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`${API_URL}/api/law/lessons/${levelId}`);
      if (!response.ok) throw new Error('Failed to fetch lesson');

      const data = await response.json();
      setLesson(data);
    } catch (err) {
      console.error('Lesson fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to track progress');
        return;
      }

      // Mark lesson as complete
      await fetch(`${API_URL}/api/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          levelId,
          type: 'lesson',
          isCorrect: true
        })
      });

      setCompleted(true);
    } catch (err) {
      console.error('Complete lesson error:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading lesson...</div>;
  }

  if (error || !lesson) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.lessonHeader}>
        <h1>{lesson.name}</h1>
        <p>{lesson.description}</p>
      </div>

      <div className={styles.lessonContent}>
        {lesson.type === 'lesson' || lesson.type === 'case_study' || lesson.type === 'statute_analysis' ? (
          <div className={styles.markdownContent}>
            <ReactMarkdown>{lesson.content || ''}</ReactMarkdown>
          </div>
        ) : null}

        {lesson.type === 'question' && lesson.questions && lesson.questions.length > 0 && (
          <div className={styles.questionsSection}>
            {lesson.questions.map((q, idx) => (
              <div key={q.id} className={styles.questionBlock}>
                <h3>Question {idx + 1}</h3>
                <p>{q.question_text}</p>
                <div className={styles.options}>
                  {['option_a', 'option_b', 'option_c', 'option_d'].map((opt) => (
                    q[opt] && (
                      <label key={opt} className={styles.option}>
                        <input type="radio" name={`q-${q.id}`} />
                        {q[opt]}
                      </label>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.lessonActions}>
        <button
          className={styles.primaryButton}
          onClick={handleCompleteLesson}
          disabled={completed}
        >
          {completed ? '✓ Lesson Complete' : 'Mark as Complete'}
        </button>
        <button
          className={styles.secondaryButton}
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}
