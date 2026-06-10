import {
  Slider as AriaSlider,
  type SliderProps as AriaSliderProps,
  Label,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface SliderProps<T extends number | number[]>
  extends Omit<AriaSliderProps<T>, "className"> {
  label?: ReactNode;
  /** Show the current value next to the label. Default: true. */
  showValue?: boolean;
  className?: string;
}

/**
 * A range slider (React Aria `Slider`). Replaces `<input type="range">`, whose
 * track and thumb render differently in every browser. Supports single value or
 * a `[min, max]` range (pass an array `value`/`defaultValue`).
 */
export function Slider<T extends number | number[]>({
  label,
  showValue = true,
  className,
  ...props
}: SliderProps<T>) {
  return (
    <AriaSlider className={cx("kf-slider", className)} {...props}>
      {(label != null || showValue) && (
        <div className="kf-slider__header">
          {label != null ? <Label className="kf-field__label">{label}</Label> : <span />}
          {showValue && <SliderOutput className="kf-slider__output" />}
        </div>
      )}
      <SliderTrack className="kf-slider__track">
        {({ state }) =>
          state.values.map((_, i) => (
            <SliderThumb key={i} index={i} className="kf-slider__thumb" />
          ))
        }
      </SliderTrack>
    </AriaSlider>
  );
}
