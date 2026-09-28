import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.tsx';

/** Build-time prerender: the shipped HTML already contains the complete page (works without JS). */
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
