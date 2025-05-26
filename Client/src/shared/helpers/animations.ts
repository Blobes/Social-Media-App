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
  dir: "LEFT" | "RIGHT",
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
  }
};
export const moveOut = (
  dir: "LEFT" | "RIGHT",
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
