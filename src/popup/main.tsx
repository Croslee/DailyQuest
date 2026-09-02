import React from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './Popup';
import { I18nProvider } from '@/i18n/I18nContext';
import { FocusProvider } from '@/contexts/FocusContext';
import '../styles/globals.css';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <FocusProvider>
        <Popup />
      </FocusProvider>
    </I18nProvider>
  </React.StrictMode>
);
