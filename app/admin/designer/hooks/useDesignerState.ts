'use client';

import { useState, useCallback, useRef } from 'react';
import { PRO_COLORS, MockupProduct, ProductColor } from '@/lib/mockup-system';
import { DesignElement, DesignerState, DragState, ResizeState } from '../types';

/**
 * Initial state for the designer
 */
const initialState: DesignerState = {
  product: null,
  color: PRO_COLORS[0],
  customColor: '',
  view: 'front',
  elements: [],
  selectedElementId: null,
  selectedSizes: [],
  zoom: 100,
  showGuides: true,
  designName: '',
};

/**
 * Custom hook for managing designer state
 * 
 * Centralizes all state management for the merchandise designer,
 * including product selection, design elements, and canvas interactions.
 */
export function useDesignerState() {
  const [state, setState] = useState<DesignerState>(initialState);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  /**
   * Update multiple state properties at once
   */
  const updateState = useCallback((updates: Partial<DesignerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update a specific design element by ID
   */
  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  /**
   * Add a new design element to the canvas
   */
  const addElement = useCallback((element: Omit<DesignElement, 'id'>) => {
    const newElement: DesignElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElementId: newElement.id,
    }));
    return newElement.id;
  }, []);

  /**
   * Delete a design element by ID
   */
  const deleteElement = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
      selectedElementId: prev.selectedElementId === id ? null : prev.selectedElementId,
    }));
  }, []);

  /**
   * Select a product and initialize the designer
   */
  const selectProduct = useCallback((product: MockupProduct) => {
    setState(prev => ({
      ...prev,
      product,
      view: 'front',
      elements: [],
      selectedElementId: null,
    }));
  }, []);

  /**
   * Reset the designer to initial state
   */
  const resetDesigner = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Get the currently selected element
   */
  const selectedElement = state.elements.find(el => el.id === state.selectedElementId);

  /**
   * Get the current product color (custom or preset)
   */
  const productColor = state.customColor || state.color.hex;

  /**
   * Get the current mockup URL based on view
   */
  const currentMockupUrl = state.product?.views.find(v => v.angle === state.view)?.mockupUrl 
    || state.product?.thumbnailUrl 
    || '';

  return {
    // State
    state,
    isDragging,
    isResizing,
    
    // Refs
    canvasRef,
    dragRef,
    resizeRef,
    
    // Setters
    setIsDragging,
    setIsResizing,
    
    // Actions
    updateState,
    updateElement,
    addElement,
    deleteElement,
    selectProduct,
    resetDesigner,
    
    // Computed values
    selectedElement,
    productColor,
    currentMockupUrl,
  };
}

export type UseDesignerStateReturn = ReturnType<typeof useDesignerState>;

