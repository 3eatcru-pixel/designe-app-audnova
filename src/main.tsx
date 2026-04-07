import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AudNovaProvider } from './context/AudNovaContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudNovaProvider>
      <App />
    </AudNovaProvider>
  </StrictMode>,
);
