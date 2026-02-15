import { Outlet } from "react-router-dom";
import Header from "../../layout/Header";
import MathMadnessSidebar from "./components/MathMadnessSidebar";
import "./mathMadness.css";

const MathMadnessLayout = () => {
  return (
    <div className="mathmadness-shell min-h-screen bg-gradient-to-br from-[#030712] via-[#0a1224] to-[#07142c] text-slate-100">
      <Header />
      <div className="flex min-h-screen pt-16">
        <MathMadnessSidebar />
        <main className="flex-1 min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MathMadnessLayout;
