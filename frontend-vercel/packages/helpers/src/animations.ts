"use client";

import { keyframes } from "@mui/system";

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;
export const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

interface Move {
  dir?: "LEFT" | "RIGHT" | "CENTER" | "BOTTOM";
  from?: string;
  to?: string;
}
export const moveIn = (
  params: Move = { dir: "RIGHT", from: "-14px", to: "10px" },
) => {
  const { dir, from, to } = params;
  switch (dir) {
    case "LEFT":
      return keyframes`
          from {
            transform: translateX(${from});
          }
          to {
            transform: translateX(${to});
          }
      `;
    case "RIGHT":
      return keyframes`
          from {
            transform: translateX(${to});
          }
          to {
            transform: translateX(${from});
          }
        `;
    case "CENTER":
      return keyframes`
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      `;
    case "BOTTOM":
      return keyframes`
            from {
              transform: translateY(${to});
            }
            to {
              transform: translateY(${from});
            }
          `;
  }
};

export const moveOut = (
  params: Move = { dir: "RIGHT", from: "10px", to: "-14px" },
) => {
  const { dir, from, to } = params;
  switch (dir) {
    case "LEFT":
      return keyframes`
        from {
          transform: translateX(${from});
        }
        to {
          transform: translateX(${to});
        }
      `;
    case "RIGHT":
      return keyframes`
        from {
          transform: translateX(${to});
        }
        to {
          transform: translateX(${from});
        }
      `;
    case "CENTER":
      return keyframes`
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.8);
        }
      `;
    case "BOTTOM":
      return keyframes`
            from {
              transform: translateY(${from});
            }
            to {
              transform: translateY(${to});
            }
          `;
  }
};

export const pulse = (from?: number, to?: number) => keyframes`
  from {
    transform : scale(${from ?? 1});
  }
  to {
   transform : scale(${to ?? 1.3});
  }
`;

export const shrinkWidth = keyframes`
  from {
    width : 100%;
  }
  to {
   width : 0%;
  }
`;

// Define rotation animation
export const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const pulseAndRotate = keyframes`
  from { transform: scale(1) rotate(0deg); }
  to { transform: scale(1.1) rotate(360deg); }
`;

export const heartPop = keyframes`
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  15% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  80% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
`;
