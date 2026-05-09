import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@/app/i18n';

// react-day-picker stylesheet must load BEFORE @/index.css so that our custom
// CSS variable overrides in index.css take precedence (CSS cascade is order-
// sensitive across files; lazy-loading the rdp stylesheet via DateRangeFilter
// would cause it to win — overwriting our overrides).
import 'react-day-picker/style.css';

import '@/index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found in index.html');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
