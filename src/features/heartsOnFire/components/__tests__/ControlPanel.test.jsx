import { render, fireEvent } from "@testing-library/react";
import ControlPanel from "../ControlPanel.jsx";

describe("ControlPanel", () => {
  const baseProps = {
    params: {
      heartRate: 72,
      strokeVolume: 70,
      respiratoryRate: 12,
      tidalVolume: 500,
      inspiredO2: 0.21,
      hemoglobin: 14,
      membraneThickness: 1,
      vqScatter: 0.1,
    },
    presetId: "rest",
    onChange: vi.fn(),
    onPreset: vi.fn(),
    onReset: vi.fn(),
    colorBlindSafe: false,
    onColorBlind: vi.fn(),
    reducedMotion: false,
  };

  it("invokes onPreset when clicking a preset pill", () => {
    const { getByText } = render(<ControlPanel {...baseProps} />);
    fireEvent.click(getByText(/Exercise/i));
    expect(baseProps.onPreset).toHaveBeenCalled();
  });

  it("invokes onChange for sliders", () => {
    const { getByLabelText } = render(<ControlPanel {...baseProps} />);
    const slider = getByLabelText(/Heart Rate/i);
    fireEvent.change(slider, { target: { value: 90 } });
    expect(baseProps.onChange).toHaveBeenCalledWith("heartRate", 90);
  });

  it("toggles colorblind palette", () => {
    const { getByText } = render(<ControlPanel {...baseProps} />);
    fireEvent.click(getByText(/Colorblind-safe/));
    expect(baseProps.onColorBlind).toHaveBeenCalledWith(true);
  });

  it("shows numeric values with precision for FiO2 and VQ", () => {
    const { getByText } = render(<ControlPanel {...baseProps} />);
    expect(getByText("0.21")).toBeInTheDocument();
    expect(getByText("0.10")).toBeInTheDocument();
  });
});
