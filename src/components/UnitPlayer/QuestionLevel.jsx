import { useState } from 'react';

export default function QuestionLevel({ level, onComplete }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const handleSubmit = () => {
    if (!userAnswer.trim()) {
      alert('Please provide an answer');
      return;
    }

    if (level.question_type === 'mcq') {
      // For MCQ, userAnswer is the index
      const correct = parseInt(userAnswer) === level.correctAnswer;
      setIsCorrect(correct);
    } else if (level.question_type === 'fill') {
      // For fill-in-blank, normalize and compare
      const userNormalized = userAnswer.trim().toLowerCase();
      const correctNormalized = level.correctAnswer.trim().toLowerCase();
      const correct = userNormalized === correctNormalized;
      setIsCorrect(correct);
    }

    setSubmitted(true);
  };

  const handleContinue = () => {
    onComplete(isCorrect);
  };

  if (level.question_type === 'mcq') {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h3 style={styles.title}>{level.title}</h3>
          <p style={styles.question}>{level.content}</p>

          <div style={styles.options}>
            {level.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => !submitted && setUserAnswer(idx.toString())}
                style={{
                  ...styles.option,
                  ...(userAnswer === idx.toString() ? styles.optionSelected : {}),
                  ...(submitted && idx === level.correctAnswer ? styles.optionCorrect : {}),
                  ...(submitted && userAnswer === idx.toString() && idx !== level.correctAnswer ? styles.optionWrong : {})
                }}
                disabled={submitted}
              >
                {option}
                {submitted && idx === level.correctAnswer && ' ✓'}
                {submitted && userAnswer === idx.toString() && idx !== level.correctAnswer && ' ✗'}
              </button>
            ))}
          </div>

          {!submitted ? (
            <button onClick={handleSubmit} style={styles.submitBtn}>
              Check Answer
            </button>
          ) : (
            <div>
              {isCorrect ? (
                <div style={styles.feedback}>
                  <p style={styles.correct}>✓ Correct!</p>
                  <button onClick={handleContinue} style={styles.continueBtn}>
                    Continue
                  </button>
                </div>
              ) : (
                <div style={styles.feedback}>
                  <p style={styles.incorrect}>✗ Incorrect. Try again or continue.</p>
                  <div style={styles.feedbackButtons}>
                    <button
                      onClick={() => {
                        setUserAnswer('');
                        setSubmitted(false);
                      }}
                      style={styles.tryAgainBtn}
                    >
                      Try Again
                    </button>
                    <button onClick={handleContinue} style={styles.continueBtn}>
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (level.question_type === 'fill') {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h3 style={styles.title}>{level.title}</h3>
          <p style={styles.question}>{level.content}</p>

          <input
            type="text"
            value={userAnswer}
            onChange={(e) => !submitted && setUserAnswer(e.target.value)}
            placeholder="Type your answer..."
            style={styles.input}
            disabled={submitted}
            autoFocus
          />

          {!submitted ? (
            <button onClick={handleSubmit} style={styles.submitBtn}>
              Check Answer
            </button>
          ) : (
            <div>
              {isCorrect ? (
                <div style={styles.feedback}>
                  <p style={styles.correct}>✓ Correct!</p>
                  <button onClick={handleContinue} style={styles.continueBtn}>
                    Continue
                  </button>
                </div>
              ) : (
                <div style={styles.feedback}>
                  <p style={styles.incorrect}>
                    ✗ Incorrect. The correct answer is: <strong>{level.correctAnswer}</strong>
                  </p>
                  <div style={styles.feedbackButtons}>
                    <button
                      onClick={() => {
                        setUserAnswer('');
                        setSubmitted(false);
                      }}
                      style={styles.tryAgainBtn}
                    >
                      Try Again
                    </button>
                    <button onClick={handleContinue} style={styles.continueBtn}>
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div>Unknown question type</div>;
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto'
  },
  content: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '20px',
    marginBottom: '24px',
    color: '#333'
  },
  question: {
    fontSize: '18px',
    color: '#444',
    marginBottom: '30px',
    fontWeight: '500'
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px'
  },
  option: {
    padding: '16px 20px',
    background: '#f8f9fa',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    fontWeight: '500'
  },
  optionSelected: {
    background: '#e7f3ff',
    borderColor: '#007bff',
    color: '#007bff'
  },
  optionCorrect: {
    background: '#d4edda',
    borderColor: '#28a745',
    color: '#28a745'
  },
  optionWrong: {
    background: '#f8d7da',
    borderColor: '#dc3545',
    color: '#dc3545'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    marginBottom: '24px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  submitBtn: {
    padding: '14px 32px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s ease'
  },
  feedback: {
    marginTop: '24px',
    textAlign: 'center'
  },
  correct: {
    fontSize: '18px',
    color: '#28a745',
    marginBottom: '16px',
    fontWeight: '600'
  },
  incorrect: {
    fontSize: '16px',
    color: '#dc3545',
    marginBottom: '16px',
    fontWeight: '500'
  },
  feedbackButtons: {
    display: 'flex',
    gap: '12px'
  },
  tryAgainBtn: {
    flex: 1,
    padding: '12px 20px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  continueBtn: {
    flex: 1,
    padding: '12px 20px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};
