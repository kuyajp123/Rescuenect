import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './App.tsx'
import Try from './Try.tsx'

import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path='/' element={<App />}></Route>
        <Route path='/Try' element={<Try />}></Route>
      </Routes>
      
    </Router>
  </StrictMode>,
)
