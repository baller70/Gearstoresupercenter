'use client';

import { useState, useCallback, useRef } from 'react';

// Types for the design editor
export interface DesignLayer {
  id: string;
  type: 'logo' | 'text' | 'shape' | 'graphic';
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  // Type-specific properties
  content?: string; // For text layers
  src?: string; // For logo/graphic layers
  fill?: string; // For shape layers
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  effects?: LayerEffect[];
}

export interface LayerEffect {
  type: 'shadow' | 'outline' | 'blur' | 'glow';
  enabled: boolean;
  color?: string;
  blur?: number;
  offsetX?: number;
  offsetY?: number;
  thickness?: number;
}

export interface DesignState {
  layers: DesignLayer[];
  selectedLayerId: string | null;
  canvasZoom: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  productType: string;
  productAngle: 'front' | 'back' | 'side';
  productColor: string;
}

export interface HistoryEntry {
  state: DesignState;
  timestamp: number;
  description: string;
}

const MAX_HISTORY = 50;

export function useDesignEditor(initialState?: Partial<DesignState>) {
  const [state, setState] = useState<DesignState>({
    layers: [],
    selectedLayerId: null,
    canvasZoom: 1,
    showGrid: true,
    showRulers: true,
    snapToGrid: true,
    gridSize: 10,
    productType: 'basketball-tshirt',
    productAngle: 'front',
    productColor: '#FFFFFF',
    ...initialState,
  });

  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Record state change to history
  const recordHistory = useCallback((description: string, newState: DesignState) => {
    const entry: HistoryEntry = {
      state: JSON.parse(JSON.stringify(newState)),
      timestamp: Date.now(),
      description,
    };
    
    // Remove any future history if we're not at the end
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(entry);
    
    // Limit history size
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Undo action
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const entry = historyRef.current[historyIndexRef.current];
      setState(JSON.parse(JSON.stringify(entry.state)));
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  }, []);

  // Redo action
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const entry = historyRef.current[historyIndexRef.current];
      setState(JSON.parse(JSON.stringify(entry.state)));
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  }, []);

  // Generate unique ID for layers
  const generateLayerId = () => `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add a new layer
  const addLayer = useCallback((layer: Omit<DesignLayer, 'id' | 'zIndex'>) => {
    setState(prev => {
      const newLayer: DesignLayer = {
        ...layer,
        id: generateLayerId(),
        zIndex: prev.layers.length,
      };
      const newState = { ...prev, layers: [...prev.layers, newLayer], selectedLayerId: newLayer.id };
      recordHistory(`Add ${layer.type} layer`, newState);
      return newState;
    });
  }, [recordHistory]);

  // Update a layer
  const updateLayer = useCallback((layerId: string, updates: Partial<DesignLayer>, addToHistory = true) => {
    setState(prev => {
      const newLayers = prev.layers.map(l => l.id === layerId ? { ...l, ...updates } : l);
      const newState = { ...prev, layers: newLayers };
      if (addToHistory) recordHistory(`Update layer`, newState);
      return newState;
    });
  }, [recordHistory]);

  // Remove a layer
  const removeLayer = useCallback((layerId: string) => {
    setState(prev => {
      const layer = prev.layers.find(l => l.id === layerId);
      const newLayers = prev.layers.filter(l => l.id !== layerId);
      const newState = {
        ...prev,
        layers: newLayers,
        selectedLayerId: prev.selectedLayerId === layerId ? null : prev.selectedLayerId
      };
      recordHistory(`Remove ${layer?.type || 'layer'}`, newState);
      return newState;
    });
  }, [recordHistory]);

  // Duplicate a layer
  const duplicateLayer = useCallback((layerId: string) => {
    setState(prev => {
      const layer = prev.layers.find(l => l.id === layerId);
      if (!layer) return prev;
      const newLayer: DesignLayer = {
        ...layer,
        id: generateLayerId(),
        name: `${layer.name} copy`,
        x: layer.x + 10,
        y: layer.y + 10,
        zIndex: prev.layers.length,
      };
      const newState = { ...prev, layers: [...prev.layers, newLayer], selectedLayerId: newLayer.id };
      recordHistory(`Duplicate layer`, newState);
      return newState;
    });
  }, [recordHistory]);

  // Move layer in z-order
  const moveLayerOrder = useCallback((layerId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setState(prev => {
      const layers = [...prev.layers].sort((a, b) => a.zIndex - b.zIndex);
      const idx = layers.findIndex(l => l.id === layerId);
      if (idx === -1) return prev;

      let newIdx = idx;
      if (direction === 'up' && idx < layers.length - 1) newIdx = idx + 1;
      else if (direction === 'down' && idx > 0) newIdx = idx - 1;
      else if (direction === 'top') newIdx = layers.length - 1;
      else if (direction === 'bottom') newIdx = 0;

      if (newIdx !== idx) {
        const [layer] = layers.splice(idx, 1);
        layers.splice(newIdx, 0, layer);
        const newLayers = layers.map((l, i) => ({ ...l, zIndex: i }));
        const newState = { ...prev, layers: newLayers };
        recordHistory(`Move layer ${direction}`, newState);
        return newState;
      }
      return prev;
    });
  }, [recordHistory]);

  // Select a layer
  const selectLayer = useCallback((layerId: string | null) => {
    setState(prev => ({ ...prev, selectedLayerId: layerId }));
  }, []);

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((layerId: string) => {
    setState(prev => {
      const newLayers = prev.layers.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l);
      return { ...prev, layers: newLayers };
    });
  }, []);

  // Toggle layer lock
  const toggleLayerLock = useCallback((layerId: string) => {
    setState(prev => {
      const newLayers = prev.layers.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l);
      return { ...prev, layers: newLayers };
    });
  }, []);

  // Canvas controls
  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, canvasZoom: Math.max(0.25, Math.min(4, zoom)) }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState(prev => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const toggleRulers = useCallback(() => {
    setState(prev => ({ ...prev, showRulers: !prev.showRulers }));
  }, []);

  const toggleSnapToGrid = useCallback(() => {
    setState(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }));
  }, []);

  const setGridSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, gridSize: size }));
  }, []);

  // Product controls
  const setProductType = useCallback((productType: string) => {
    setState(prev => ({ ...prev, productType }));
  }, []);

  const setProductAngle = useCallback((angle: 'front' | 'back' | 'side') => {
    setState(prev => ({ ...prev, productAngle: angle }));
  }, []);

  const setProductColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, productColor: color }));
  }, []);

  // Get selected layer
  const selectedLayer = state.layers.find(l => l.id === state.selectedLayerId) || null;

  // Snap position to grid
  const snapToGridPosition = useCallback((x: number, y: number): { x: number; y: number } => {
    if (!state.snapToGrid) return { x, y };
    const gridSize = state.gridSize;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }, [state.snapToGrid, state.gridSize]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    addLayer,
    updateLayer,
    removeLayer,
    duplicateLayer,
    moveLayerOrder,
    selectLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    setZoom,
    toggleGrid,
    toggleRulers,
    toggleSnapToGrid,
    setGridSize,
    setProductType,
    setProductAngle,
    setProductColor,
    selectedLayer,
    snapToGridPosition,
    recordHistory,
  };
}

