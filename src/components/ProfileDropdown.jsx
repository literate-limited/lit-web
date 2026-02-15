import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../api';

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  const initials = (() => {
    const first = (user?.firstName || user?.first_name || '').slice(0, 1);
    const last = (user?.lastName || user?.last_name || '').slice(0, 1);
    const init = `${first}${last}`.trim();
    return init || 'U';
  })();

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initials.toUpperCase()}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0B0B0E] shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate('/profile/me');
            }}
            className="block w-full px-3 py-2 text-left text-sm text-white/85 hover:bg-white/10"
          >
            Profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              clearToken();
              navigate('/welcome');
            }}
            className="block w-full px-3 py-2 text-left text-sm text-white/85 hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

