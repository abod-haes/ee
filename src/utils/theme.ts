// Theme configuration (no longer using MUI)
// This file is kept for potential future use but MUI dependency has been removed
const theme = {
    direction: "rtl" as const,
    colors: {
        primary: {
            main: "#10b981", // Green
            light: "#34d399",
            dark: "#059669",
        },
        secondary: {
            main: "#2563eb", // Blue
            light: "#60a5fa",
            dark: "#1e40af",
        },
        background: {
            default: "#f3f4f6",
            paper: "#ffffff",
        },
    },
    typography: {
        fontFamily: "Cairo, sans-serif",
        h1: {
            fontSize: "2.5rem",
            fontWeight: 700,
        },
        h2: {
            fontSize: "2rem",
            fontWeight: 600,
        },
        h3: {
            fontSize: "1.75rem",
            fontWeight: 600,
        },
        h4: {
            fontSize: "1.5rem",
            fontWeight: 600,
        },
        body1: {
            fontSize: "1rem",
        },
    },
};

export default theme;
