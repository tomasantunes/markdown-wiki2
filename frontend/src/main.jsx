import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ErrorBoundary from "./ErrorBoundary";
import 'bootstrap/dist/css/bootstrap.min.css'
import * as bootstrap from 'bootstrap'
import './index.css'
import App from './App.jsx'

window.bootstrap = bootstrap
import './bootstrap5-dropdown-ml-hack'

createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
)
