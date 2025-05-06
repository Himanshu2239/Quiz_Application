import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;  // Optional target URL
  label?: string; // Optional button label
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export default function BackButton({
  to,
  label = 'Back',
  variant = 'outline',
  className = ''
}: BackButtonProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      // If no specific route is provided, go back in history
      window.history.back();
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handleClick}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}