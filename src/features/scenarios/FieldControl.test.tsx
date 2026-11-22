import { fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FieldControl } from "@/features/scenarios/FieldControl";
import type { SliderField } from "@/features/scenarios/fields";

const euro: SliderField<"rate"> = {
  key: "rate",
  kind: "slider",
  label: "Monthly investment",
  help: "",
  min: 0,
  max: 5000,
  step: 25,
  unit: "euro",
};
const percent: SliderField<"ter"> = {
  key: "ter",
  kind: "slider",
  label: "TER",
  help: "",
  min: 0,
  max: 0.02,
  step: 0.0005,
  unit: "percent",
};
const months: SliderField<"sma"> = {
  key: "sma",
  kind: "slider",
  label: "SMA window",
  help: "",
  min: 2,
  max: 12,
  step: 1,
  unit: "months",
};

function setup<K extends string>(field: SliderField<K>, value: number) {
  const onChange = vi.fn();
  render(
    <TooltipProvider>
      <FieldControl field={field} value={value} onChange={onChange} />
    </TooltipProvider>,
  );
  const box = screen.getByRole("textbox", { name: `${field.label} value` });
  return { onChange, box: box as HTMLInputElement };
}

function type(box: HTMLInputElement, text: string, commit: "Enter" | "blur" = "Enter") {
  fireEvent.focus(box);
  fireEvent.change(box, { target: { value: text } });
  if (commit === "Enter") fireEvent.keyDown(box, { key: "Enter" });
  else fireEvent.blur(box);
}

test("REQ-003-01 typing a value off the step grid sets exactly that value", () => {
  const { onChange, box } = setup(euro, 500);
  expect(box.value).toBe("500");
  type(box, "437");
  expect(onChange).toHaveBeenLastCalledWith(437);
  type(box, "1234.5", "blur");
  expect(onChange).toHaveBeenLastCalledWith(1234.5);
});

test("REQ-003-01 percent values are entered in percent", () => {
  const { onChange, box } = setup(percent, 0.002);
  expect(box.value).toBe("0.2");
  type(box, "0,07");
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange.mock.calls[0]?.[0]).toBeCloseTo(0.0007, 10);
});

test("REQ-003-02 values outside the range are clamped", () => {
  const { onChange, box } = setup(euro, 500);
  type(box, "99999");
  expect(onChange).toHaveBeenLastCalledWith(5000);
  type(box, "-10");
  expect(onChange).toHaveBeenLastCalledWith(0);
});

test("REQ-003-02 invalid input and Escape restore the previous value", () => {
  const { onChange, box } = setup(euro, 500);
  type(box, "abc");
  expect(onChange).not.toHaveBeenCalled();
  expect(box.value).toBe("500");
  fireEvent.focus(box);
  fireEvent.change(box, { target: { value: "800" } });
  fireEvent.keyDown(box, { key: "Escape" });
  expect(box.value).toBe("500");
  fireEvent.blur(box);
  expect(onChange).not.toHaveBeenCalled();
});

test("REQ-003-02 whole-unit settings are rounded", () => {
  const { onChange, box } = setup(months, 10);
  type(box, "7.6");
  expect(onChange).toHaveBeenLastCalledWith(8);
});
