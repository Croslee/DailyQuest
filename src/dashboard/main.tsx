import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './Dashboard';
import { I18nProvider } from '@/i18n/I18nContext';
import { FocusProvider } from '@/contexts/FocusContext';
import '../styles/globals.css';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <FocusProvider>
        <Dashboard />
      </FocusProvider>
    </I18nProvider>
  </React.StrictMode>
);
