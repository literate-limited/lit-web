import { useState } from 'react';
import { useBrand } from '../context/BrandContext';
import { Link } from 'react-router-dom';
import { ssoLogin } from '../api/auth.service';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { brand } = useBrand();
  const isDebatica = brand.code === 'deb';
  const redirectPathByBrand = {
    deb: '/deb',
    ttv: '/ttv',
    law: '/search',
    mat: '/math',
  };
  const redirectPath = redirectPathByBrand[brand.code] || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Central SSO for all brands; brand_id is used to issue a brand-scoped token.
      await ssoLogin({
        email: form.email,
        password: form.password,
        brandId: brand.code,
        redirectPath
      });
      return;
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  if (isDebatica) {
    return (
      <div style={debStyles.page}>
        <img src="/debatica/landing-page.png" alt="Debatica" style={debStyles.bgImg} />
        <div style={debStyles.overlay} />
        <div style={debStyles.wrap}>
          <div style={debStyles.card}>
            <h1 style={debStyles.title}>Welcome Back</h1>
            <p style={debStyles.subtitle}>Sign in to continue your debate training.</p>
            <form onSubmit={handleSubmit} style={debStyles.form}>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={debStyles.input}
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={debStyles.input}
              />
              {error && <div style={debStyles.error}>{error}</div>}
              <button type="submit" style={debStyles.button}>Sign In</button>
            </form>
            <p style={debStyles.link}>
              New here? <Link to="/signup" style={debStyles.anchor}>Create your Debatica account</Link>
            </p>
            <p style={debStyles.link}>
              <Link to="/" style={debStyles.anchor}>Back to Debatica home</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Login</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
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
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.button}>Login</button>
        </form>
        <p style={styles.link}>
          Don't have an account? <Link to="/signup">Sign up as teacher</Link>
        </p>
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
    padding: '20px'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    marginBottom: '30px',
    fontSize: '24px',
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
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  error: {
    color: '#dc3545',
    fontSize: '14px'
  },
  link: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px'
  }
};

const debStyles = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
    color: '#fff'
  },
  bgImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(7, 2, 16, 0.72)'
  },
  wrap: {
    position: 'relative',
    zIndex: 1,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px'
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(10,10,16,0.58)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
    padding: '28px'
  },
  title: {
    margin: 0,
    textAlign: 'center',
    fontSize: '34px',
    fontWeight: 900,
    letterSpacing: '0.06em'
  },
  subtitle: {
    textAlign: 'center',
    marginTop: '8px',
    marginBottom: '20px',
    color: 'rgba(255,255,255,0.75)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  input: {
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    padding: '12px 14px',
    fontSize: '16px'
  },
  button: {
    marginTop: '4px',
    border: 'none',
    borderRadius: '10px',
    background: '#ffffff',
    color: '#000',
    padding: '12px 14px',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.06em'
  },
  error: {
    color: '#fecaca',
    fontSize: '14px'
  },
  link: {
    marginTop: '14px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '14px'
  },
  anchor: {
    color: '#fff',
    textDecoration: 'underline'
  }
};
