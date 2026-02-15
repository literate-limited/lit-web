import DisplayText from "../components/DisplayText";
import InputField from "../../components/InputField";
import Keyboard from "../../components/Keyboard";

export default function FillInBlankPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <DisplayText />
      <InputField />
      <Keyboard />
    </div>
  );
}
