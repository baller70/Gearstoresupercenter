/**
 * Designer Types
 * 
 * Centralized type definitions for the merchandise designer.
 * These types define the data structures used across all designer components.
 */

import { MockupProduct, ProductColor } from '@/lib/mockup-system';

/**
 * Represents a design element that can be placed on the product canvas.
 * Elements can be images or text with various transformation properties.
 */
export interface DesignElement {
  /** Unique identifier for the element */
  id: string;
  /** Type of element - determines how it's rendered */
  type: 'image' | 'text';
  /** Horizontal position as percentage (0-100) */
  x: number;
  /** Vertical position as percentage (0-100) */
  y: number;
  /** Width as percentage of canvas (0-100) */
  width: number;
  /** Height as percentage of canvas (0-100) */
  height: number;
  /** Rotation angle in degrees (-180 to 180) */
  rotation: number;
  /** Opacity percentage (0-100) */
  opacity: number;
  /** Whether the element is locked from editing */
  locked: boolean;
  /** Whether the element is visible on canvas */
  visible: boolean;
  
  // Image-specific properties
  /** Source URL for image elements */
  src?: string;
  /** Original image width in pixels */
  originalWidth?: number;
  /** Original image height in pixels */
  originalHeight?: number;
  
  // Text-specific properties
  /** Text content */
  text?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Font family name */
  fontFamily?: string;
  /** Font weight (normal, bold, etc.) */
  fontWeight?: string;
  /** Text/fill color as hex string */
  fill?: string;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
}

/**
 * Complete state of the designer interface.
 * Tracks the current product, color, view, and all design elements.
 */
export interface DesignerState {
  /** Currently selected product (null during product selection) */
  product: MockupProduct | null;
  /** Selected product color */
  color: ProductColor;
  /** Custom color hex value (overrides color if set) */
  customColor: string;
  /** Current view angle */
  view: 'front' | 'back';
  /** All design elements on the canvas */
  elements: DesignElement[];
  /** ID of the currently selected element (null if none) */
  selectedElementId: string | null;
  /** Array of selected size IDs */
  selectedSizes: string[];
  /** Canvas zoom level (50-150) */
  zoom: number;
  /** Whether to show printable area guides */
  showGuides: boolean;
  /** Name of the design */
  designName: string;
}

/** Designer workflow steps */
export type DesignerStep = 'product' | 'design' | 'options' | 'save';

/**
 * Props for the DesignCanvas component
 */
export interface DesignCanvasProps {
  /** Current designer state */
  state: DesignerState;
  /** Function to update designer state */
  updateState: (updates: Partial<DesignerState>) => void;
  /** Function to update a specific element */
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  /** Ref to the canvas container */
  canvasRef: React.RefObject<HTMLDivElement>;
  /** Whether an element is being dragged */
  isDragging: boolean;
  /** Setter for dragging state */
  setIsDragging: (dragging: boolean) => void;
  /** Whether an element is being resized */
  isResizing: boolean;
  /** Setter for resizing state */
  setIsResizing: (resizing: boolean) => void;
  /** Ref tracking drag operation data */
  dragRef: React.MutableRefObject<DragState | null>;
  /** Ref tracking resize operation data */
  resizeRef: React.MutableRefObject<ResizeState | null>;
}

/**
 * Props for the PropertiesPanel component
 */
export interface PropertiesPanelProps {
  /** Currently selected element (null if none) */
  selectedElement: DesignElement | undefined;
  /** Function to update a specific element */
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  /** Current designer state */
  state: DesignerState;
  /** Function to update designer state */
  updateState: (updates: Partial<DesignerState>) => void;
  /** Function to change the current step */
  setStep: (step: DesignerStep) => void;
}

/**
 * State tracking during drag operations
 */
export interface DragState {
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
}

/**
 * State tracking during resize operations
 */
export interface ResizeState {
  corner: string;
  startX: number;
  startY: number;
  elementStartWidth: number;
  elementStartHeight: number;
}

/**
 * Props for color overlay component
 */
export interface ProductColorOverlayProps {
  /** Mockup image URL */
  mockupUrl: string;
  /** Product name for alt text */
  productName: string;
  /** Color to apply as hex string */
  color: string;
  /** Additional CSS classes */
  className?: string;
}

