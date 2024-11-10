import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

// Custom theme hook
const useTheme = () => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const stored = localStorage.getItem('app-theme');
    if (stored) {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    
    // Apply theme class
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.classList.toggle('dark');
  }, [theme]);

  return { theme, toggleTheme };
};

// Base layout component that all utility apps will use
interface UtilityAppLayoutProps {
  children: React.ReactNode;
  backgroundUrl?: string;
  position?: 'left' | 'center' | 'right';
}

export const UtilityAppLayout: React.FC<UtilityAppLayoutProps> = ({ 
  children, 
  backgroundUrl = '/api/placeholder/1920/1080',
  position = 'left'
}) => {
  const { theme, toggleTheme } = useTheme();

  const getPositionClasses = () => {
    switch (position) {
      case 'center':
        return 'mx-auto';
      case 'right':
        return 'ml-auto';
      default:
        return '';
    }
  };

  return (
    <div className={`min-h-screen relative flex items-center ${theme}`}>
      {/* Background with ad space */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity"
        style={{
          backgroundImage: `url(${backgroundUrl})`,
          filter: 'brightness(0.7)'
        }}
      />

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50"
        onClick={toggleTheme}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-white" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      {/* Utility area */}
      <div className={`relative w-1/3 min-h-fit p-8 ${getPositionClasses()}`}>
        <Card className="bg-card/95 backdrop-blur-sm shadow-2xl border-border">
          {children}
        </Card>
      </div>
    </div>
  );
};

// Base hook for API configurations
export const useApiConfig = () => {
  const [config] = useState({
    youtubeApiKey: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    aiProvider: process.env.NEXT_PUBLIC_AI_PROVIDER || 'openai',
    aiApiKey: process.env.NEXT_PUBLIC_AI_API_KEY,
    aiModel: process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-4',
    language: 'en',
  });
  
  return { config };
};

// Base hook for analytics and tracking
export const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, string>) => {
    // Implementation for tracking (Google Analytics, Mixpanel, etc.)
    console.log('Track event:', eventName, properties);
  }, []);

  const trackError = useCallback((error: Error, context?: string) => {
    // Error tracking implementation
    console.error('Error:', error, context);
  }, []);

  return { trackEvent, trackError };
};

// Shared utilities for all apps
export const utils = {
  createLoadingStates: <T extends string>(steps: T[]): Record<T, boolean> => {
    return steps.reduce((acc, step) => ({ ...acc, [step]: false }), {} as Record<T, boolean>);
  },

  formatNumber: (num: number): string => {
    return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);
  },

  handleApiError: (error: Error) => {
    console.error('API Error:', error);
    return {
      error: true,
      message: error.message || 'An unexpected error occurred'
    };
  },

  storage: {
    save: (key: string, data: string) => localStorage.setItem(key, JSON.stringify(data)),
    load: (key: string) => {
      try {
        return JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        return null;
      }
    },
    remove: (key: string) => localStorage.removeItem(key),
  },
};