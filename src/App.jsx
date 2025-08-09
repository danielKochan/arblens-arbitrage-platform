import React from "react";
import ErrorBoundary from './components/ErrorBoundary';
import Routes from './Routes';
import { AuthProvider } from './contexts/AuthContext';
import { DataIngestionProvider } from './contexts/DataIngestionContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataIngestionProvider>
          <Routes />
        </DataIngestionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;