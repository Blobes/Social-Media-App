import { Direction, IDragConfig } from "@repo/types";

export const dragToCloseConfig = (
  config?: IDragConfig,
  dir: Direction = "left",
): IDragConfig => {
  const finalConfig: IDragConfig = config ?? {
    axis: dir === "up" || dir === "down" ? "y" : "x",
    dragOrigin: dir === "left" ? "ltr" : dir === "right" ? "rtl" : undefined,
  };

  const { axis, dragOrigin, threshold, closeAtMiddle } = finalConfig;
  return {
    axis: axis,
    dragOrigin: dragOrigin,
    closeAtMiddle: closeAtMiddle,
    threshold: threshold,
  };
};
