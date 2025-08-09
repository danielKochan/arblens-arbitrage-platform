import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Login } from './Login';
import { Signup } from './Signup';

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode);

  if (!isOpen) return null;

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
        
        {mode === 'signin' ? (
          <Login onToggleMode={toggleMode} onClose={onClose} />
        ) : (
          <Signup onToggleMode={toggleMode} onClose={onClose} />
        )}
      </div>
    </div>
  );
}