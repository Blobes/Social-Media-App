import { Direction, IDragConfig } from "@repo/types";

export const dragToCloseConfig = (
  config?: IDragConfig,
  dir: Direction = "left",
): IDragConfig => {
  const axis = config?.axis || (dir === "up" || dir === "down" ? "Y" : "X");
  const dragOrigin =
    config?.dragOrigin ||
    (dir === "left" ? "LTR" : dir === "right" ? "RTL" : undefined);
  const closeAtMiddle = config?.closeAtMiddle ?? false;
  const threshold = config?.threshold || 60;

  return {
    axis,
    dragOrigin,
    closeAtMiddle,
    threshold,
  };
};
