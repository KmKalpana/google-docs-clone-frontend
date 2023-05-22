// @ts-nocheck
import React from 'react';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import './App.css';
import Editor from './components/Editor';
import {v4 as uuid} from 'uuid';
function App() {
  return (
      <BrowserRouter>
        <Routes>
        <Route path='/' element={<Navigate replace to={`/docs/${uuid()}`}/>}/>
        <Route path='/docs/:id' element={<Editor/>}/> 
    </Routes>
    </BrowserRouter>
  )
}

export default App;
