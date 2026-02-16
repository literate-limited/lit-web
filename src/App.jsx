import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { BrandProvider, useBrand } from './context/BrandContext';
import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { clearToken, getToken } from './api';
import { decodeToken, initiateLogin } from './api/auth.service';
import Signup from './pages/Signup';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import JoinClass from './pages/JoinClass';
import Room from './pages/Room';
import { ttvRoutes } from './features/ttv/routes';
import './styles/themes.css';
import AuthCallback from './authentication/AuthCallback';


// Signphony Translation
import SignTranslator from './components/avatar/SignTranslator';
import SignViewer from './components/avatar/SignViewer';

// Debatica (new)
import DebaticaLayout from './features/debatica/layout/DebaticaLayout';
import DebaticaLandingPage from './features/debatica/pages/DebaticaLandingPage';
import DebateLibraryPage from './features/debatica/pages/DebateLibraryPage';
import DebateDetailPage from './features/debatica/pages/DebateDetailPage';
import DebateAttemptPage from './features/debatica/pages/DebateAttemptPage';
import DebateHistoryPage from './features/debatica/pages/DebateHistoryPage';

// Lawlore (legal research)
import LawloreLandingPage from './features/lawlore/pages/LawloreLandingPage';
import LawloreSearchPage from './features/lawlore/pages/LawloreSearchPage';
import StatuteDetailPage from './features/lawlore/pages/StatuteDetailPage';
import CaseDetailPage from './features/lawlore/pages/CaseDetailPage';
import SavedSearchesPage from './features/lawlore/pages/SavedSearchesPage';

// Lawlore Phase 3 (learning platform)
import LawCurriculumPage from './features/lawlore/pages/LawCurriculumPage';
import UnitProgressPage from './features/lawlore/pages/UnitProgressPage';
import LawAssessmentPage from './features/lawlore/pages/LawAssessmentPage';
import LessonViewer from './features/lawlore/components/LessonViewer';
import QuizInterface from './features/lawlore/components/QuizInterface';
import { mathMadnessRoutes } from './features/mathmadness/routes';

function PageLoadingFallback() {
  return (
    <div style={{ padding: 24, color: '#fff', background: '#0b0b0e', minHeight: '100vh' }}>
      Loading…
    </div>
  );
}

function RequireAuth() {
  const location = useLocation();
  const token = getToken();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

function RequireToken() {
  const location = useLocation();
  const token = getToken();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

function AppContent() {
  const { brand, theme, meta } = useBrand();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const attemptedSilentSsoRef = useRef(false);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.title = meta.title;

    // Set meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', meta.description);
    }
  }, [theme, meta]);

  // Load user from localStorage
  useEffect(() => {
    // If we have a stale `user` object without any token, clear it so routing is deterministic.
    if (!getToken()) {
      localStorage.removeItem('user');
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
      }
    }

    // If we have a token (SSO) but no saved user object, derive a minimal user from the JWT.
    if (!savedUser && getToken()) {
      const decoded = decodeToken(getToken());
      if (decoded) {
        const derived = {
          id: decoded.userId || decoded.accountId || decoded.sub || null,
          email: decoded.email || null,
          role: decoded.role || (Array.isArray(decoded.roles) ? decoded.roles[0] : null) || 'student',
        };
        setUser(derived);
        localStorage.setItem('user', JSON.stringify(derived));
      }
    }
    setLoading(false);
  }, []);

  // Silent SSO: auto-initiate OAuth via a top-level redirect. This avoids relying on
  // third-party cookies (which are blocked by default in modern browsers).
  useEffect(() => {
    if (attemptedSilentSsoRef.current) return;
    attemptedSilentSsoRef.current = true;

    const path = window.location.pathname || "/";
    if (getToken()) return;
    // Allow silent SSO even on /login and /signup so cross-brand navigation doesn't
    // strand users on a login screen when they already have a global SSO session.
    // Never auto-bounce away from explicit auth routes.
    if (path.startsWith("/auth/callback") || path.startsWith("/signup")) return;
    if (sessionStorage.getItem("silent_sso_attempted") === "1") return;
    sessionStorage.setItem("silent_sso_attempted", "1");

    // TODO: SSO endpoints not yet implemented in lit-api
    // Once /api/sso/* endpoints are mounted, re-enable seamless login:
    // (async () => {
    //   try {
    //     const redirectPath = `${window.location.pathname}${window.location.search || ""}`;
    //     const redirectUri = `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(redirectPath)}`;
    //     await initiateLogin({ brandId: brand.code, redirectUri });
    //   } catch (err) {
    //     // Noisy failures here are counterproductive; user can still log in manually.
    //   }
    // })();
  }, [brand.code]);

  const handleLogin = (userData) => {
    // Store user data (without token, token is stored separately in api.js)
    const userToStore = userData.user || userData;
    setUser(userToStore);
    localStorage.setItem('user', JSON.stringify(userToStore));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    clearToken();
  };

  const ttvRouteElements = useMemo(() => {
    return ttvRoutes.map((r) => (
      <Route
        key={r.path}
        path={r.path}
        element={<Suspense fallback={<PageLoadingFallback />}>{r.element}</Suspense>}
      >
        {(r.children || []).map((c) => {
          const el = <Suspense fallback={<PageLoadingFallback />}>{c.element}</Suspense>;
          if (c.index) return <Route key="index" index element={el} />;
          return <Route key={c.path} path={c.path} element={el} />;
        })}
      </Route>
    ));
  }, []);

  const mathMadnessRouteElements = useMemo(() => {
    return mathMadnessRoutes.map((r) => (
      <Route
        key={r.path}
        path={r.path}
        element={<Suspense fallback={<PageLoadingFallback />}>{r.element}</Suspense>}
      >
        {(r.children || []).map((c) => {
          const el = <Suspense fallback={<PageLoadingFallback />}>{c.element}</Suspense>;
          if (c.index) return <Route key="index" index element={el} />;
          return <Route key={c.path} path={c.path} element={el} />;
        })}
      </Route>
    ));
  }, []);


  if (loading) return <PageLoadingFallback />;

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              brand.code === 'deb'
                ? (getToken() ? <Navigate to="/deb" replace /> : <DebaticaLandingPage />)
                : brand.code === 'law'
                ? <Navigate to="/search" replace />
                : brand.code === 'mat'
                ? <Navigate to="/math" replace />
                : (getToken() && user
                  ? (user.role === 'teacher'
                    ? <Navigate to="/teacher-dashboard" replace />
                    : <Navigate to={localStorage.getItem('lastRoomId') ? `/student-dashboard/${localStorage.getItem('lastRoomId')}` : '/join'} replace />)
                  : <Navigate to="/login" replace />)
            }
          />

          {/* Authentication Routes (common to all brands) */}
          <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/join/:code" element={<JoinClass onLogin={handleLogin} />} />
          <Route path="/join" element={<Navigate to="/login" replace />} />

          {/* Lawlore - Public legal research (no auth required) */}
          <Route path="/search" element={<LawloreLandingPage />} />
          <Route path="/search/results" element={<LawloreSearchPage />} />
          <Route path="/statute/:id" element={<StatuteDetailPage />} />
          <Route path="/case/:id" element={<CaseDetailPage />} />

          {/* Lawlore Phase 3 - Learning platform (public curriculum, authenticated features) */}
          <Route path="/law" element={<LawCurriculumPage />} />
          <Route path="/law/unit/:unitId" element={<UnitProgressPage />} />
          <Route path="/law/lesson/:levelId" element={<LessonViewer />} />
          <Route path="/law/quiz/:levelId" element={<QuizInterface />} />
          {mathMadnessRouteElements}

          {/* Authenticated app surfaces */}
          <Route element={<RequireAuth />}>
            <Route
              path="/teacher-dashboard"
              element={<TeacherDashboard user={user} onLogout={handleLogout} />}
            />

            <Route
              path="/student-dashboard/:roomId"
              element={<StudentDashboard user={user} onLogout={handleLogout} />}
            />

            <Route path="/room/:roomId" element={<Room user={user} />} />

            <Route element={<RequireToken />}>
              {/* Debatica */}
              <Route element={<DebaticaLayout />}>
                <Route path="/deb" element={<DebateLibraryPage />} />
                <Route path="/deb/history" element={<DebateHistoryPage />} />
                <Route path="/deb/debate/:id" element={<DebateDetailPage />} />
                <Route path="/deb/attempt/:id" element={<DebateAttemptPage />} />
              </Route>

              {/* TTV */}
              {ttvRouteElements}

              {/* Lawlore - Authenticated features */}
              <Route path="/saved-searches" element={<SavedSearchesPage />} />
              <Route path="/law/assessment" element={<LawAssessmentPage />} />
            </Route>
          </Route>

          {/* Signphony Translation - Public Route */}
          <Route path="/translate" element={<SignTranslator />} />
          <Route path="/viewer" element={<SignViewer />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function App() {
  return (
    <BrandProvider>
      <AppContent />
    </BrandProvider>
  );
}

export default App;
