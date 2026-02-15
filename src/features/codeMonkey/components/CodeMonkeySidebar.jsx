import { NavLink } from "react-router-dom";
import { FiCode, FiGlobe } from "react-icons/fi";

const CodeMonkeySidebar = () => {
  return (
    <aside className="codemonkey-sidebar">
      <div className="codemonkey-brand">
        <div className="codemonkey-logo">CM</div>
        <div>
          <p className="codemonkey-title">Code Monkey</p>
          <p className="codemonkey-subtitle">Repo intelligence lab</p>
        </div>
      </div>

      <div className="codemonkey-section">
        <p className="codemonkey-section-label">Explore</p>
        <NavLink
          to="/code-monkey"
          className={({ isActive }) =>
            `codemonkey-link ${isActive ? "is-active" : ""}`
          }
        >
          <FiCode />
          Code Explorer
        </NavLink>
      </div>

      <div className="codemonkey-footer">
        <FiGlobe />
        <span>Open-source only</span>
      </div>
    </aside>
  );
};

export default CodeMonkeySidebar;
