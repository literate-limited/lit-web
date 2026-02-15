import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../../api';
import styles from '../styles/lawlore.module.css';

export default function QuizInterface() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [levelId]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`${API_URL}/api/law/lessons/${levelId}`);
      if (!response.ok) throw new Error('Failed to fetch quiz');

      const data = await response.json();
      setQuiz(data);
    } catch (err) {
      console.error('Quiz fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmitQuiz = async () => {
    const questions = quiz.questions || [];
    let correct = 0;

    questions.forEach((q) => {
      if (parseInt(answers[q.id]) === parseInt(q.correct_answer)) {
        correct++;
      }
    });

    const percentage = Math.round((correct / questions.length) * 100);
    setScore({ correct, total: questions.length, percentage });
    setSubmitted(true);

    // Save to backend
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            levelId,
            type: 'quiz',
            isCorrect: percentage >= 70,
            score: percentage
          })
        });
      }
    } catch (err) {
      console.error('Save quiz result error:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading quiz...</div>;
  }

  if (error || !quiz || !quiz.questions || quiz.questions.length === 0) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  const questions = quiz.questions;
  const q = questions[currentQuestion];

  return (
    <div className={styles.container}>
      <div className={styles.quizHeader}>
        <h1>{quiz.name}</h1>
        <p>Question {currentQuestion + 1} of {questions.length}</p>
      </div>

      {!submitted ? (
        <div className={styles.quizSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className={styles.questionBlock}>
            <h2>{q.question_text}</h2>

            <div className={styles.options}>
              {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, idx) => {
                const value = String(idx + 1);
                return (
                  q[opt] && (
                    <label key={opt} className={styles.option}>
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={value}
                        checked={answers[q.id] === value}
                        onChange={() => handleSelectAnswer(q.id, value)}
                      />
                      <span>{q[opt]}</span>
                    </label>
                  )
                );
              })}
            </div>
          </div>

          <div className={styles.quizActions}>
            {currentQuestion > 0 && (
              <button
                className={styles.secondaryButton}
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                Previous
              </button>
            )}

            {currentQuestion < questions.length - 1 ? (
              <button
                className={styles.primaryButton}
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                disabled={!answers[q.id]}
              >
                Next
              </button>
            ) : (
              <button
                className={styles.primaryButton}
                onClick={handleSubmitQuiz}
                disabled={!answers[q.id]}
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.quizResults}>
          <div className={styles.scoreCard}>
            <h2>Quiz Complete!</h2>
            <p className={styles.scoreDisplay}>
              {score.correct} / {score.total} correct
            </p>
            <p className={styles.percentage}>
              {score.percentage}%
            </p>
            {score.percentage >= 70 && (
              <p className={styles.success}>Great job! You've mastered this material.</p>
            )}
            {score.percentage < 70 && (
              <p className={styles.warning}>Review the material and try again.</p>
            )}
          </div>

          <div className={styles.reviewSection}>
            <h3>Review Your Answers</h3>
            {questions.map((q, idx) => {
              const userAnswer = parseInt(answers[q.id]);
              const correctAnswer = parseInt(q.correct_answer);
              const isCorrect = userAnswer === correctAnswer;

              return (
                <div key={q.id} className={`${styles.reviewItem} ${isCorrect ? styles.correct : styles.incorrect}`}>
                  <p><strong>Q{idx + 1}: {q.question_text}</strong></p>
                  <p>Your answer: {q[`option_${String.fromCharCode(96 + userAnswer)}`]}</p>
                  {!isCorrect && <p>Correct answer: {q[`option_${String.fromCharCode(96 + correctAnswer)}`]}</p>}
                </div>
              );
            })}
          </div>

          <div className={styles.quizActions}>
            <button
              className={styles.primaryButton}
              onClick={() => navigate(-1)}
            >
              Back to Unit
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => {
                setSubmitted(false);
                setCurrentQuestion(0);
                setAnswers({});
                setScore(null);
              }}
            >
              Retake Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
