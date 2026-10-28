import React from 'react';

export default function Card({
  children,
  className = '',
  hoverEffect = false,
  padding = 'p-6',
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={`bg-white border border-stone-200 rounded-xl transition-all ${
        hoverEffect ? 'hover:border-stone-300 hover:shadow-xs' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
