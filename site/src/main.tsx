import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/guide.css';
import App from './App.tsx';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Production HTML is prerendered (scripts/prerender.mjs); dev renders on the client.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
