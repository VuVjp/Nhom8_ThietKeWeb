import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';
import { AppAuthProvider } from './auth/appAuth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppAuthProvider>
        <App />
      </AppAuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
    </BrowserRouter>
  </StrictMode>,
);
