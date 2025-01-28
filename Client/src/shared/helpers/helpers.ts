"use client";

// Check theme mode function return true if theme is dark mode
/*
const checkMode = (mode) => {
  const systemIsDarkTheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  return (mode === "system" && systemIsDarkTheme) || mode === "dark"
    ? true
    : false;
};

export const resizeWidth = (childId, threshold = 1, offset = 0) => {
  return new Promise((resolve) => {
    const parentElement = document.querySelector(`#${childId}`).parentElement;
    const gap = window.getComputedStyle(parentElement).getPropertyValue("gap");

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      let currentWidth = width - (threshold > 1 ? parseInt(gap) : 0);
      currentWidth = (currentWidth / width) * 100;
      currentWidth = `${parseFloat(
        currentWidth / threshold - (threshold > 1 ? offset : 0)
      ).toFixed(2)}%`;
      resolve(currentWidth);
    });

    resizeObserver.observe(parentElement);
  });
};
*/

export const extractInitials = (value: string): string => {
  let initials = `${value.split(" ")[0][0]}${value.split(" ")[1][0]}`;
  return initials.toUpperCase();
};

// export const handleFeedback = (content: string, type: "SUCCESS" | "ERROR") => {
//   setTimeout(() => setMessage({ content: content, type: type }), 1000);
// };

/* 
 // Update theme mode
  const updateThemeMode = () => {
    if (mode === "system") setMode("dark");
    else if (mode === "dark") setMode("light");
    else setMode("system");
  };

  // Listen for theme mode change and update automatically
  useEffect(() => {
    if (mode) {
      // Save the theme mode to local storage whenever it changes
      localStorage.setItem("theme_mode", mode);

      // Update global theme mode state with the mode saved to the local storage
      const currentMode = localStorage.getItem("theme_mode");
      setThemeMode(currentMode);
    }
  }, [mode, setThemeMode]);

  const [themeMode, setThemeMode] = useState(() => {
    // Check local storage for user preference
    const savedTheme = localStorage.getItem("theme_mode");
    return savedTheme ? savedTheme : "system"; // Default to system
  });
  return (
    <context.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </context.Provider>
  );
};
export const useThemeContext = () => useContext(context);
*/
