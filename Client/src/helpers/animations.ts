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
export const moveIn = (
  dir: "LEFT" | "RIGHT" | "CENTER",
  from: string = "-14px",
  to: string = "10px"
) => {
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
  }
};

export const moveOut = (
  dir: "LEFT" | "RIGHT" | "CENTER",
  from: string = "10px",
  to: string = "-14px"
) => {
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
  }
};

export const heartBeat = keyframes`
  from {
    transform : scale(1);
  }
  to {
   transform : scale(1.3);
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
