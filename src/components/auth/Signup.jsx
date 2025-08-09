import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Eye, EyeOff, AlertCircle, Loader, CheckCircle } from 'lucide-react';

export function Signup({ onToggleMode, onClose }) {
  const { signUp, loading, authError, clearAuthError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const errors = {};
    
    if (!formData?.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData?.fullName?.trim()?.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }
    
    if (!formData?.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData?.password) {
      errors.password = 'Password is required';
    } else if (formData?.password?.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/?.test(formData?.password)) {
      errors.password = 'Password must contain at least one lowercase, uppercase, and number';
    }
    
    if (!formData?.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData?.password !== formData?.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    clearAuthError();
    setSuccess(false);
    
    if (!validateForm()) {
      return;
    }

    const { data, error } = await signUp(
      formData?.email, 
      formData?.password, 
      formData?.fullName?.trim()
    );
    
    if (!error) {
      setSuccess(true);
      // Auto-close after showing success message
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
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

    // Clear success state when user makes changes
    if (success) {
      setSuccess(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-600 mb-4">
            Welcome to ArbLens! Your account has been created successfully.
          </p>
          <p className="text-sm text-gray-500">
            You'll be redirected to the dashboard shortly...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join ArbLens</h2>
        <p className="text-gray-600">Create your account to start finding arbitrage opportunities</p>
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
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            value={formData?.fullName}
            onChange={(e) => handleInputChange('fullName', e?.target?.value)}
            placeholder="Enter your full name"
            className={validationErrors?.fullName ? 'border-red-300 focus:border-red-500' : ''}
            disabled={loading}
          />
        </div>

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
              placeholder="Create a strong password"
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
          <p className="text-xs text-gray-500 mt-1">
            Must contain at least 6 characters with uppercase, lowercase, and number
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData?.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
              placeholder="Confirm your password"
              className={`pr-10 ${validationErrors?.confirmPassword ? 'border-red-300 focus:border-red-500' : ''}`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={loading}
            >
              {showConfirmPassword ? (
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
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="font-medium text-blue-600 hover:text-blue-500"
            disabled={loading}
          >
            Sign In
          </button>
        </p>
      </div>
      <div className="mt-4 text-xs text-gray-500 text-center">
        By creating an account, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
}