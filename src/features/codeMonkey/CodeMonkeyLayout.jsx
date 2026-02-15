import { Outlet } from "react-router-dom";
import CodeMonkeySidebar from "./components/CodeMonkeySidebar";
import "./codeMonkey.css";

const CodeMonkeyLayout = () => {
  return (
    <div className="codemonkey-shell">
      <div className="codemonkey-noise" />
      <div className="codemonkey-frame">
        <CodeMonkeySidebar />
        <main className="codemonkey-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CodeMonkeyLayout;
