import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-600 shadow-xs',
    secondary:
      'bg-stone-100 text-stone-800 hover:bg-stone-200 active:bg-stone-300 focus-visible:ring-stone-400',
    outline:
      'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 focus-visible:ring-stone-400',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600',
    ghost:
      'text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus-visible:ring-stone-400',
    dark:
      'bg-stone-900 text-white hover:bg-stone-800 focus-visible:ring-stone-700',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
