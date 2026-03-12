import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { hasAnalyticsConsent, initAnalytics } from './lib/analytics';
import CookieConsent from './components/CookieConsent';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import App from './App';

// Initialize analytics if user already consented (returning visitor)
if (hasAnalyticsConsent() === true) {
  initAnalytics();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <CookieConsent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
