'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean; // Controlled state (optional)
  onToggle?: () => void; // Toggle handler (optional)
  optional?: boolean;
  forceOpen?: boolean; // For sections that cannot be closed
}

export function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onToggle,
  optional = false,
  forceOpen = false
}: CollapsibleSectionProps) {
  
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  
  // Use controlled state if provided, otherwise internal state
  // If forceOpen is true, it is always open
  const isExpanded = forceOpen ? true : (controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen);

  const handleToggle = () => {
    if (forceOpen) return;
    
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <section className="mb-8">
      {/* Header */}
      <div 
        onClick={handleToggle}
        className={`flex items-center gap-3 mb-4 ${forceOpen ? '' : 'cursor-pointer group'}`}
      >
        <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase group-hover:text-white transition-colors">
          {title} {optional && <span className="opacity-50 font-normal ml-1">(Optional)</span>}
        </span>
        
        <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
        
        {!forceOpen && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-white/40 group-hover:text-white transition-colors"
          >
            <ChevronDown size={16} />
          </motion.div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
