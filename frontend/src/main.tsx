import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { QueryProvider } from '@/app/providers';
import { AuthProvider } from '@/features/auth/hooks/useAuth';
import { ToastProvider } from '@/shared/ui/Toast';
import { router } from '@/app/router';

import './index.css';
import 'leaflet/dist/leaflet.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);

