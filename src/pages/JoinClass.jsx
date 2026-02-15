import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function JoinClass({ onLogin }) {
  const { code } = useParams();
  const [classData, setClassData] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadClass();
  }, [code]);

  const loadClass = async () => {
    try {
      const data = await api.getClassByCode(code);
      setClassData(data);
      setLoading(false);
    } catch (err) {
      setError('Class not found');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const { confirmPassword, ...joinData } = form;
      const result = await api.joinClass(code, joinData);
      // Use onLogin to update App.jsx user state
      onLogin(result.student);
      // Store class info for the student's context
      localStorage.setItem('classData', JSON.stringify(result.classData));
      navigate(`/room/${result.roomId}`);
    } catch (err) {
      setError('Failed to join class');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (error && !classData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.error}>{error}</h1>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Join Class</h1>
        <div style={styles.classInfo}>
          <h2>{classData.name}</h2>
          <p>Class Code: {classData.code}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Middle Name (optional)"
            value={form.middleName}
            onChange={(e) => setForm({ ...form, middleName: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            style={styles.input}
          />
          {error && <div style={styles.errorMsg}>{error}</div>}
          <button type="submit" style={styles.button}>Join Class</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    background: '#f5f5f5'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px'
  },
  title: {
    marginBottom: '20px',
    fontSize: '24px',
    textAlign: 'center'
  },
  classInfo: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px'
  },
  button: {
    padding: '12px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  errorMsg: {
    color: '#dc3545',
    fontSize: '14px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '20px'
  },
  error: {
    color: '#dc3545',
    textAlign: 'center'
  }
};
