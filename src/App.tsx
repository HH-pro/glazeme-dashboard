// src/App.tsx
import React from 'react';
import Dashboard from './components/Dashboard';
import BuildUpdatesContainer from './components/BuildUpdatesContainer';
function App() {
  return (
    <div className="App">
            <BuildUpdatesContainer />

      <Dashboard />
    </div>
  );
}

export default App;