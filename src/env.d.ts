// Ambient declarations.
//
// Agentation is a development-only overlay (see components/Agentation.astro).
// Its React imports are loaded dynamically and only under import.meta.env.DEV,
// so Vite tree-shakes them out of production builds and no @types/react is
// installed. Declaring the modules here keeps `astro check` clean without
// pulling type-only dependencies into the project for a dev-only tool.
declare module 'react';
declare module 'react-dom/client';
