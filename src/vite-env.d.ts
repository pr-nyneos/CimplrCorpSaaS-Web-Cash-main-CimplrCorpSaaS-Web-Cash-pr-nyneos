/// <reference types="vite/client" />

declare module 'react-grid-layout' {
  import * as React from 'react';
  
  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export interface ReactGridLayoutProps {
    className?: string;
    style?: React.CSSProperties;
    width?: number;
    autoSize?: boolean;
    cols?: number;
    draggableCancel?: string;
    draggableHandle?: string;
    verticalCompact?: boolean;
    layout?: Layout[];
    margin?: [number, number];
    containerPadding?: [number, number] | null;
    rowHeight?: number;
    maxRows?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
    useCSSTransforms?: boolean;
    transformScale?: number;
    compactType?: 'vertical' | 'horizontal' | null;
    preventCollision?: boolean;
    isBounded?: boolean;
    resizeHandles?: string[];
    children?: React.ReactNode;
    onLayoutChange?: (layout: Layout[]) => void;
    onDragStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onDrag?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onResizeStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onResize?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
  }

  export interface ResponsiveProps extends ReactGridLayoutProps {
    breakpoints?: { [key: string]: number };
    cols?: { [key: string]: number };
    layouts?: { [key: string]: Layout[] };
    onBreakpointChange?: (newBreakpoint: string, newCols: number) => void;
    children?: React.ReactNode;
  }

  export class Responsive extends React.Component<ResponsiveProps> {}
  
  export function WidthProvider<T extends React.ComponentType<any>>(component: T): T;
  
  const ResponsiveReactGridLayout: React.ComponentType<ResponsiveProps>;
  export default ResponsiveReactGridLayout;
}