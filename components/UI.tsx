import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded-full";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#ffffff] to-[#e43928] text-black shadow-[0_0_20px_rgba(228,57,40,0.4)] hover:shadow-[0_0_30px_rgba(228,57,40,0.6)] active:scale-95",
    secondary: "bg-[#111111] border border-white/10 text-white hover:bg-[#1a1a1a] active:scale-95",
    danger: "bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20",
    ghost: "bg-transparent text-[#A0AEC0] hover:text-white"
  };

  const sizes = {
    sm: "h-8 px-4 text-xs",
    md: "h-12 px-6 text-sm",
    lg: "h-14 px-8 text-base",
  };

  return (
    <motion.button 
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], fullWidth && "w-full", className)} 
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "glass-panel rounded-[32px] p-6 text-white overflow-hidden relative",
        onClick && "cursor-pointer transition-transform hover:scale-[1.01]",
        className
      )}
    >
      {children}
    </div>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => {
  return (
    <input 
      className={cn(
        "w-full bg-[#000000] border border-white/10 rounded-2xl h-14 px-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#e43928] transition-colors",
        className
      )}
      {...props}
    />
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "bg-[#e43928]" }) => {
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-black inline-block", color)}>
      {children}
    </span>
  );
};

export const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
    {subtitle && <p className="text-[#A0AEC0] text-sm mt-1">{subtitle}</p>}
  </div>
);