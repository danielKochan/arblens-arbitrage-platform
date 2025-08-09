import React from "react";
import { Menu, X, User, LogOut, Settings, Key } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AuthModal } from "../auth/AuthModal";

export function Header({
  title = "ArbLens",
  showMenuButton = true,
  onMenuClick,
  rightContent
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const { user, userProfile, signOut, isAuthenticated, loading } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    onMenuClick?.();
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const openAuthModal = (mode = 'signin') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  if (loading) {
    return (
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showMenuButton && (
              <div className="w-6 h-6 bg-gray-200 animate-pulse rounded"></div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
          <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full"></div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showMenuButton && (
              <button
                onClick={toggleMenu}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6 text-gray-600" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-600" />
                )}
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>

          <div className="flex items-center space-x-3">
            {rightContent}
            
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">
                      {userProfile?.full_name || user?.email}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {userProfile?.role?.replace('_', ' ') || 'User'}
                    </div>
                  </div>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">
                        {userProfile?.full_name || 'User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.email}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        window.location.href = '/system-settings';
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        window.location.href = '/api-management';
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      API Keys
                    </button>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authMode}
      />
    </>
  );
}