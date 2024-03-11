import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './components/App';
import styles from './styles/global.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
])

createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);