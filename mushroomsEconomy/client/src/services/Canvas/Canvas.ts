import { TWINDOW } from "../../config";

enum EDIRECTION {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

export type TCanvas = {
    parentId: string;
    WINDOW: TWINDOW;
    WIDTH: number;
    HEIGHT: number;
    callbacks: {
        mouseMove: (x: number, y: number, screenX?: number, screenY?: number) => void;
        mouseDown: (x: number, y: number) => void;
        mouseUp: (x: number, y: number) => void;
        mouseRightClickDown: (x: number, y: number) => void;
        mouseClick: (x: number, y: number) => void;
        mouseLeave?: () => void;
        mouseWheel?: (delta: number, x: number, y: number) => void;
        mouseMiddleDown?: (x: number, y: number, screenX?: number, screenY?: number) => void;
        mouseMiddleUp?: (x: number, y: number) => void;
        keyDown?: (event: KeyboardEvent) => void;
    },
}

class Canvas {
    parentId: string;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    canvasV: HTMLCanvasElement;
    contextV: CanvasRenderingContext2D;
    WIDTH: number;
    HEIGHT: number;
    WINDOW: TWINDOW;
    DIRECTION = {
        [EDIRECTION.UP]: -90 * Math.PI / 180,
        [EDIRECTION.DOWN]: 90 * Math.PI / 180,
        [EDIRECTION.LEFT]: 180 * Math.PI / 180,
        [EDIRECTION.RIGHT]: 0,
    }
    dx = 0;
    dy = 0;
    interval: NodeJS.Timer;
    callbacks: TCanvas['callbacks'];
    isMiddleMouseDown = false;

    constructor(options: TCanvas) {
        const { parentId, WINDOW, WIDTH, HEIGHT, callbacks } = options;
        this.parentId = parentId;
        this.canvas = document.createElement('canvas');
        if (parentId) {
            document.getElementById(parentId)?.appendChild(this.canvas);
        } else {
            document.querySelector('body')?.appendChild(this.canvas);
        }
        this.WIDTH = WIDTH || window.innerWidth;
        this.HEIGHT = HEIGHT || window.innerHeight;
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;
        this.context = this.canvas.getContext('2d')!;
        this.canvasV = document.createElement('canvas');
        this.canvasV.width = this.WIDTH;
        this.canvasV.height = this.HEIGHT;
        this.contextV = this.canvasV.getContext('2d')!;
        this.WINDOW = WINDOW;
        this.callbacks = callbacks;

        this.canvas.addEventListener('mousemove', (event) => this.mouseMoveHandler(event));
        this.canvas.addEventListener('mousedown', (event) => this.mouseDownHandler(event));
        this.canvas.addEventListener('mouseup', (event) => this.mouseUpHandler(event));
        this.canvas.addEventListener('click', (event) => this.mouseClickHandler(event));
        this.canvas.addEventListener('mouseleave', () => this.mouseLeaveHandler());
        this.canvas.addEventListener('wheel', (event) => this.mouseWheelHandler(event));
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.mouseRightClickDownHandler(event);
        });
        this.canvas.addEventListener('keydown', (event) => this.keyDownHandler(event));

        this.interval = setInterval(() => {
            if (this.dx === 0 && this.dy === 0) {
                return;
            }
            this.WINDOW.LEFT += this.dx;
            this.WINDOW.TOP += this.dy;
        }, 200);
    }

    destructor() {
        document.getElementById(this.parentId)?.removeChild(this.canvas);
        (this.contextV as CanvasRenderingContext2D | null) = null;
        (this.canvasV as HTMLCanvasElement | null) = null;
        (this.context as CanvasRenderingContext2D | null) = null;
        (this.canvas as HTMLCanvasElement | null) = null;
        clearInterval(this.interval);
    }

    mouseDownHandler(event: MouseEvent) {
        event.preventDefault();
        const { offsetX, offsetY, button } = event;
        if (button === 0) {
            this.callbacks.mouseDown(this.sx(offsetX), this.sy(offsetY));
        } else if (button === 1) {
            this.isMiddleMouseDown = true;
            if (this.callbacks.mouseMiddleDown) {
                this.callbacks.mouseMiddleDown(this.sx(offsetX), this.sy(offsetY), offsetX, offsetY);
            }
        }
    }

    mouseUpHandler(event: MouseEvent) {
        event.preventDefault();
        const { offsetX, offsetY, button } = event;
        if (button === 0) {
            this.callbacks.mouseUp(this.sx(offsetX), this.sy(offsetY));
        } else if (button === 1) {
            this.isMiddleMouseDown = false;
            if (this.callbacks.mouseMiddleUp) {
                this.callbacks.mouseMiddleUp(this.sx(offsetX), this.sy(offsetY));
            }
        }
    }

    mouseRightClickDownHandler(event: MouseEvent) {
        const { offsetX, offsetY, button } = event;
        if (button === 2) {
            this.callbacks.mouseRightClickDown(this.sx(offsetX), this.sy(offsetY));
        }
    }

    mouseClickHandler(event: MouseEvent) {
        event.preventDefault();
        const { offsetX, offsetY, button } = event;
        if (button === 0) {
            this.callbacks.mouseClick(this.sx(offsetX), this.sy(offsetY));
        }
    }

    mouseMoveHandler(event: MouseEvent) {
        const { offsetX, offsetY } = event;
        this.callbacks.mouseMove(this.sx(offsetX), this.sy(offsetY), offsetX, offsetY);
    }

    mouseLeaveHandler() {
        this.dx = 0;
        this.dy = 0;
        if (this.callbacks.mouseLeave) {
            this.callbacks.mouseLeave();
        }
    }

    mouseWheelHandler(event: WheelEvent) {
        event.preventDefault();
        const { offsetX, offsetY, deltaY } = event;
        if (this.callbacks.mouseWheel) {
            this.callbacks.mouseWheel(deltaY, this.sx(offsetX), this.sy(offsetY));
        }
    }

    keyDownHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            if (this.callbacks.keyDown) {
                this.callbacks.keyDown(event);
            }
        }
    };



    xs(x: number): number {
        return (x - this.WINDOW.LEFT) / this.WINDOW.WIDTH * this.WIDTH;
    }

    ys(y: number): number {
        return (y - this.WINDOW.TOP) / this.WINDOW.HEIGHT * this.HEIGHT;
    }

    sx(x: number): number {
        return x * this.WINDOW.WIDTH / this.WIDTH + this.WINDOW.LEFT;
    }

    sy(y: number): number {
        return y * this.WINDOW.HEIGHT / this.HEIGHT + this.WINDOW.TOP;
    }

    dec(x: number): number {
        return x / this.WINDOW.WIDTH * this.WIDTH;
    }

    clear(): void {
        this.contextV.fillStyle = 'rgb(116, 116, 116)';
        this.contextV.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    }

    clearImage(image: HTMLImageElement): void {
        this.contextV.drawImage(image, 0, 0, this.WIDTH, this.HEIGHT);
    }

    line(x1: number, y1: number, x2: number, y2: number, color = '#0f0', width = 2): void {
        this.contextV.beginPath();
        this.contextV.strokeStyle = color;
        this.contextV.lineWidth = width;
        this.contextV.moveTo(this.xs(x1), this.ys(y1));
        this.contextV.lineTo(this.xs(x2), this.ys(y2));
        this.contextV.stroke();
        this.contextV.closePath();
    }

    text(x: number, y: number, text: string, color = '#fff', font = 'bold 1rem Arial'): void {
        this.contextV.fillStyle = color;
        this.contextV.font = font;
        this.contextV.fillText(text, this.xs(x), this.ys(y));
    }

    drawFPS(FPS: string, color = 'rgb(149, 255, 50)', font = 'bold 1rem Arial'): void {
        this.contextV.fillStyle = color;
        this.contextV.font = font;
        this.contextV.fillText(FPS, 12, 36);
    }

    rect(x: number, y: number, size = 64, color = 'rgba(255, 0, 0, 1)'): void {
        this.contextV.fillStyle = color;
        this.contextV.fillRect(this.xs(x), this.ys(y), size, size);
    }

    rectangle(x: number, y: number, width = 64, height = 64, color = '#f004'): void {
        this.contextV.fillStyle = color;
        this.contextV.fillRect(this.xs(x), this.ys(y), width, height);
    }

    spriteFull(image: HTMLImageElement, dx: number, dy: number, sx: number, sy: number, size: number): void {
        this.contextV.drawImage(image, sx, sy, size, size, this.xs(dx), this.ys(dy), this.dec(1), this.dec(1));
    }

    oval(
        x: number,
        y: number,
        width: number,
        height: number,
        colorInside = 'rgba(0, 0, 0, 1)',
        widthLine = 1,
        colorOut = 'rgba(34, 255, 0, 1)'
    ): void {
        const screenX = this.xs(x);
        const screenY = this.ys(y);
        const screenWidth = width * this.WIDTH / this.WINDOW.WIDTH;
        const screenHeight = height * this.HEIGHT / this.WINDOW.HEIGHT;
        this.contextV.beginPath();
        this.contextV.ellipse(
            screenX + screenWidth / 2,
            screenY + screenHeight / 2,
            screenWidth / 2,
            screenHeight / 2,
            0,
            0,
            2 * Math.PI
        );
    
        this.contextV.fillStyle = colorInside;
        this.contextV.fill();
    
        this.contextV.lineWidth = widthLine;
        this.contextV.strokeStyle = colorOut;
        this.contextV.stroke();
    
        this.contextV.closePath();
    }

    render(): void {
        this.context.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        this.context.drawImage(this.canvasV, 0, 0);
    }
}

export default Canvas;