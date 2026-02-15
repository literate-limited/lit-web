import { useUser } from "../context/UserContext";
import DisplayCalendar from "./DisplayCalendar.jsx";

export default function Calendar() {
  const { user } = useUser();
  return (
    <div className="max-w-5xl mx-auto mt-8">
      <DisplayCalendar handle={user?.handle || ""} isSelf selectionMode="view" />
    </div>
  );
}
