import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSelector() {
  const { themeMode, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System Default', icon: Monitor }
  ];

  const currentOption = options.find((opt) => opt.key === themeMode) || options[2];
  const CurrentIcon = currentOption.icon;

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (key) => {
    setThemeMode(key);
    setIsOpen(false);
  };

  return (
    <div className="theme-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`theme-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={`Current theme: ${currentOption.label}`}
      >
        <span className="theme-dropdown-icon">
          <CurrentIcon size={16} />
        </span>
        <span className="theme-trigger-label">{currentOption.label}</span>
        <ChevronDown 
          size={14} 
          className={`theme-dropdown-chevron ${isOpen ? 'rotated' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="theme-dropdown-menu" role="menu" aria-orientation="vertical">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = themeMode === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="menuitem"
                className={`theme-dropdown-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelect(opt.key)}
              >
                <div className="theme-dropdown-item-left">
                  <span className="theme-dropdown-icon">
                    <Icon size={16} />
                  </span>
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <Check size={14} className="theme-dropdown-check" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
