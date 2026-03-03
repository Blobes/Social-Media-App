import { Direction, IDragConfig } from "@repo/types";

export const dragToCloseConfig = (
  config?: IDragConfig,
  dir: Direction = "left",
): IDragConfig => {
  const axis = config?.axis || (dir === "up" || dir === "down" ? "y" : "x");
  const dragOrigin =
    config?.dragOrigin ||
    (dir === "left" ? "ltr" : dir === "right" ? "rtl" : undefined);
  const closeAtMiddle = config?.closeAtMiddle ?? false;
  const threshold = config?.threshold || 60;

  return {
    axis,
    dragOrigin,
    closeAtMiddle,
    threshold,
  };
};
