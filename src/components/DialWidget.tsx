'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface DialWidgetProps {
  title: string;
  value: number; // current index
  values: number[]; // array of all possible values
  onChange: (index: number) => void;
  unit: string; // "mm", "f/", "ISO "
  accentColor: string; // "#94a3b8", "#06b6d4", "#a855f7"
  formatDisplay?: (value: number) => string;
  description?: string;
  disabled?: boolean;
}

export function DialWidget({
  title,
  value,
  values,
  onChange,
  unit,
  accentColor,
  formatDisplay,
  description,
  disabled = false
}: DialWidgetProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const currentValue = values[value] ?? values[0];
  const fillPercentage = (value / (values.length - 1)) * 100;

  // Format the display value
  const displayValue = formatDisplay 
    ? formatDisplay(currentValue) 
    : `${currentValue}${unit}`;

  // Calculate new index from mouse/touch Y position
  const updateValueFromPosition = useCallback((clientY: number) => {
    if (disabled || !dialRef.current) return;

    const rect = dialRef.current.getBoundingClientRect();
    // Invert: top of dial = max value, bottom = min value
    const percentage = 1 - (clientY - rect.top) / rect.height;
    const clampedPercentage = Math.max(0, Math.min(1, percentage));
    const newIndex = Math.round(clampedPercentage * (values.length - 1));
    
    if (newIndex !== value) {
      onChange(newIndex);
      console.log(`🎚️ ${title} dial changed:`, {
        index: newIndex,
        value: values[newIndex]
      });
    }
  }, [disabled, onChange, title, value, values]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    updateValueFromPosition(e.clientY);
  }, [disabled, updateValueFromPosition]);

  // Global mouse move/up handlers when dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateValueFromPosition(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateValueFromPosition]);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValueFromPosition(e.touches[0].clientY);
  }, [disabled, updateValueFromPosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    updateValueFromPosition(e.touches[0].clientY);
  }, [disabled, isDragging, updateValueFromPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      const newIndex = Math.min(value + 1, values.length - 1);
      onChange(newIndex);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const newIndex = Math.max(value - 1, 0);
      onChange(newIndex);
    }
  }, [disabled, onChange, value, values.length]);

  // Generate tick marks - show subset for readability
  const tickIndices = getTickIndices(values.length);

  return (
    <div
      className={`
        relative overflow-hidden
        bg-black/95 backdrop-blur-sm
        border border-white/10
        rounded-2xl
        shadow-xl shadow-black/50
        p-6
        min-w-[280px] max-w-[400px]
        transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isHovering && !disabled ? 'border-white/20' : ''}
      `}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Status Indicator Dot */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
          animate={{
            opacity: isDragging ? [1, 0.5, 1] : 1,
            scale: isDragging ? 1.2 : 1
          }}
          transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
        />
        {isDragging && (
          <span className="text-[10px] text-red-500 font-bold tracking-wider">REC</span>
        )}
      </div>

      <div className="flex gap-6">
        {/* Vertical Dial Track (Left Side) */}
        <div
          ref={dialRef}
          className={`
            relative w-12 h-48 
            bg-gray-900/80 
            rounded-full 
            cursor-pointer
            select-none
            ${disabled ? 'pointer-events-none' : ''}
          `}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-label={title}
          aria-valuenow={currentValue}
          aria-valuemin={values[0]}
          aria-valuemax={values[values.length - 1]}
          aria-disabled={disabled}
        >
          {/* Background Track with Gradient */}
          <div className="absolute inset-1 rounded-full bg-gray-800/50 overflow-hidden">
            {/* Fill from bottom */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-full"
              style={{ 
                backgroundColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}40`
              }}
              initial={false}
              animate={{ height: `${fillPercentage}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Tick Marks */}
          {tickIndices.map((idx) => {
            const position = 100 - (idx / (values.length - 1)) * 100;
            const isActive = idx === value;
            return (
              <div
                key={idx}
                className="absolute right-0 flex items-center"
                style={{ top: `${position}%`, transform: 'translateY(-50%)' }}
              >
                <div
                  className={`
                    w-3 h-0.5 rounded-full mr-1
                    transition-all duration-200
                    ${isActive ? 'w-4' : 'w-2'}
                  `}
                  style={{ 
                    backgroundColor: isActive ? accentColor : 'rgba(255,255,255,0.3)'
                  }}
                />
              </div>
            );
          })}

          {/* Scale Numbers (Left side of dial) */}
          {tickIndices.map((idx) => {
            const position = 100 - (idx / (values.length - 1)) * 100;
            const isActive = idx === value;
            const displayNum = values[idx];
            return (
              <div
                key={`num-${idx}`}
                className={`
                  absolute -left-8 text-[10px] font-mono
                  transition-all duration-200
                  ${isActive ? 'font-bold' : 'text-white/40'}
                `}
                style={{ 
                  top: `${position}%`, 
                  transform: 'translateY(-50%)',
                  color: isActive ? accentColor : undefined
                }}
              >
                {formatScaleNumber(displayNum, unit)}
              </div>
            );
          })}

          {/* Active Value Indicator Dot */}
          <motion.div
            className="absolute left-1/2 w-4 h-4 rounded-full border-2 border-white/30 z-10"
            style={{ 
              backgroundColor: accentColor,
              boxShadow: `0 0 12px ${accentColor}80`,
              transform: 'translateX(-50%)'
            }}
            initial={false}
            animate={{ 
              top: `${100 - fillPercentage}%`,
              scale: isDragging ? 1.3 : 1
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Right Side: Title + Digital Readout */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Title */}
          <div className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-2">
            {title}
          </div>

          {/* Digital Readout */}
          <div className="relative">
            <motion.div
              className="font-mono font-bold text-white leading-none"
              style={{ 
                fontSize: displayValue.length > 6 ? '2rem' : '2.5rem',
                textShadow: `0 0 30px ${accentColor}40`
              }}
              animate={{ scale: isDragging ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {displayValue}
            </motion.div>

            {/* Accent Line Under Readout */}
            <motion.div
              className="h-0.5 mt-2 rounded-full"
              style={{ backgroundColor: accentColor }}
              initial={false}
              animate={{ 
                width: isDragging ? '100%' : '60%',
                opacity: isDragging ? 1 : 0.6
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Visual Indicator (shallow/deep, clean/grain) */}
          <div className="mt-4">
            <VisualIndicator 
              title={title}
              percentage={fillPercentage} 
              accentColor={accentColor}
            />
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs text-white/50 mt-3 leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
          <span className="text-xs text-white/50 uppercase tracking-wider">
            Specialty Lens Active
          </span>
        </div>
      )}
    </div>
  );
}

// Helper: Get tick indices to display (subset for readability)
function getTickIndices(totalValues: number): number[] {
  if (totalValues <= 5) {
    return Array.from({ length: totalValues }, (_, i) => i);
  }
  if (totalValues <= 10) {
    // Show every other tick
    return Array.from({ length: totalValues }, (_, i) => i).filter((_, i) => i % 2 === 0);
  }
  // Show ~5-7 ticks evenly distributed
  const step = Math.floor(totalValues / 5);
  const indices: number[] = [0];
  for (let i = step; i < totalValues - 1; i += step) {
    indices.push(i);
  }
  indices.push(totalValues - 1);
  return indices;
}

// Helper: Format scale numbers for display
function formatScaleNumber(value: number, unit: string): string {
  if (unit === 'f/') return value.toString();
  if (unit === 'ISO ') return value >= 1000 ? `${value / 1000}k` : value.toString();
  return value.toString();
}

// Visual indicator component (depth of field / grain level)
function VisualIndicator({ 
  title, 
  percentage, 
  accentColor 
}: { 
  title: string; 
  percentage: number; 
  accentColor: string;
}) {
  let leftLabel = '';
  let rightLabel = '';
  
  if (title.includes('FOCAL')) {
    leftLabel = 'Wide';
    rightLabel = 'Tele';
  } else if (title.includes('APERTURE')) {
    leftLabel = 'Shallow';
    rightLabel = 'Deep';
  } else if (title.includes('ISO')) {
    leftLabel = 'Clean';
    rightLabel = 'Grain';
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] text-white/40 uppercase tracking-wider">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: accentColor, opacity: 0.6 }}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
}

export default DialWidget;
