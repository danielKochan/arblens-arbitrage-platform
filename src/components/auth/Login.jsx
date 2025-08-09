import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Eye, EyeOff, AlertCircle, Loader } from 'lucide-react';

export function Login({ onToggleMode, onClose }) {
  const { signIn, loading, authError, clearAuthError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData?.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData?.password) {
      errors.password = 'Password is required';
    } else if (formData?.password?.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    clearAuthError();
    
    if (!validateForm()) {
      return;
    }

    const { error } = await signIn(formData?.email, formData?.password);
    
    if (!error && onClose) {
      onClose();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors?.[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear auth error when user makes changes
    if (authError) {
      clearAuthError();
    }
  };

  const demoCredentials = [
    { email: 'admin@arblens.com', password: 'admin123', role: 'Admin' },
    { email: 'user@arblens.com', password: 'user123', role: 'Pro User' }
  ];

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In to ArbLens</h2>
        <p className="text-gray-600">Access your arbitrage opportunities dashboard</p>
      </div>
      {/* Demo Credentials */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</h3>
        {demoCredentials?.map((cred, index) => (
          <div key={index} className="text-xs text-blue-800 mb-1">
            <strong>{cred?.role}:</strong> {cred?.email} / {cred?.password}
          </div>
        ))}
      </div>
      {(authError || Object.keys(validationErrors)?.length > 0) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-red-700">
            {authError && <div className="mb-1">{authError}</div>}
            {Object.values(validationErrors)?.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={formData?.email}
            onChange={(e) => handleInputChange('email', e?.target?.value)}
            placeholder="Enter your email"
            className={validationErrors?.email ? 'border-red-300 focus:border-red-500' : ''}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData?.password}
              onChange={(e) => handleInputChange('password', e?.target?.value)}
              placeholder="Enter your password"
              className={`pr-10 ${validationErrors?.password ? 'border-red-300 focus:border-red-500' : ''}`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="font-medium text-blue-600 hover:text-blue-500"
            disabled={loading}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}