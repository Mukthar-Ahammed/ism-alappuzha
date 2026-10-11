// page-flip 2.0.7 ships no type declarations; this covers the parts the issue reader uses.
declare module "page-flip" {
  export type FlipSetting = {
    startPage: number;
    size: "fixed" | "stretch";
    width: number;
    height: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    drawShadow: boolean;
    flippingTime: number;
    usePortrait: boolean;
    startZIndex: number;
    autoSize: boolean;
    maxShadowOpacity: number;
    showCover: boolean;
    mobileScrollSupport: boolean;
    clickEventForward: boolean;
    useMouseEvents: boolean;
    swipeDistance: number;
    showPageCorners: boolean;
    disableFlipByClick: boolean;
  };

  export type WidgetEvent = { data: unknown; object: PageFlip };

  export class PageFlip {
    constructor(element: HTMLElement, setting: Partial<FlipSetting>);
    loadFromHTML(items: HTMLElement[]): void;
    on(eventName: "flip" | "changeOrientation" | "changeState" | "init" | "update", callback: (event: WidgetEvent) => void): this;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    destroy(): void;
  }
}
