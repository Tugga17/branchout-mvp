import 'leaflet/dist/leaflet.css';   // MUST BE FIRST
import './index.css';                // Tailwind next
import App from './App.jsx';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
