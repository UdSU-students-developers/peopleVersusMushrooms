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
        mouseWheel?: (delta: number, x: number, y: number) => void;
        mouseMove: (x: number, y: number) => void;
        mouseDown: (x: number, y: number) => void;
        mouseUp: (x: number, y: number) => void;
        mouseLeave?: () => void;
        mouseClick: (x: number, y: number) => void;
        mouseRightClick: () => void;
    },
}

class Canvas {
    parentId: string;
    // контексты и канвасы
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    canvasV: HTMLCanvasElement;
    contextV: CanvasRenderingContext2D;
    // общая ширина и высота канвасов
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

    constructor(options: TCanvas) {
        const { parentId, WINDOW, WIDTH, HEIGHT, callbacks } = options;
        this.parentId = parentId;
        // задаём канвасы
        this.canvas = document.createElement('canvas');
        if (parentId) {
            document.getElementById(parentId)?.appendChild(this.canvas);
        } else {
            document.querySelector('body')?.appendChild(this.canvas);
        }
        this.WIDTH = WIDTH || window.innerWidth;
        this.HEIGHT = HEIGHT || window.innerHeight; // потому что иначе эта скотина добавляет вертикальный скролл
        // main canvas
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;
        this.context = this.canvas.getContext('2d')!;
        // virtual canvas
        this.canvasV = document.createElement('canvas');
        this.canvasV.width = this.WIDTH;
        this.canvasV.height = this.HEIGHT;
        this.contextV = this.canvasV.getContext('2d')!;
        // задаем окошко
        this.WINDOW = WINDOW;
        this.callbacks = callbacks;

        this.canvas.addEventListener('wheel', (event) => this.mouseWheelHandler(event));
        this.canvas.addEventListener('mousemove', (event) => this.mouseMoveHandler(event));
        this.canvas.addEventListener('mousedown', (event) => this.mouseDownHandler(event));
        this.canvas.addEventListener('mouseup', (event) => this.mouseUpHandler(event));
        this.canvas.addEventListener('mouseleave', () => this.mouseLeaveHandler());
        this.canvas.addEventListener('click', (event) => this.mouseClickHandler(event));
        this.canvas.addEventListener('contextmenu', (event) => this.mouseRightClickHandler(event));
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
        // @ts-ignore
        this.contextV = null;
        // @ts-ignore
        this.canvasV = null;
        // @ts-ignore
        this.context = null;
        // @ts-ignore
        this.canvas = null;
        clearInterval(this.interval);
    }

    mouseWheelHandler(event: WheelEvent) {
        event.preventDefault();
        const { offsetX, offsetY, deltaY } = event;
        if (this.callbacks.mouseWheel) {
            this.callbacks.mouseWheel(deltaY, this.sx(offsetX), this.sy(offsetY));
        }
    }

    mouseClickHandler(event: MouseEvent) {
        const { offsetX, offsetY } = event;
        this.callbacks.mouseClick(this.sx(offsetX), this.sy(offsetY));
    }

    mouseRightClickHandler(event: MouseEvent) {
        event.preventDefault();
        this.callbacks.mouseRightClick();
    }

    mouseMoveHandler(event: MouseEvent) {
        const { offsetX, offsetY } = event;
        this.callbacks.mouseMove(this.sx(offsetX), this.sy(offsetY));
    }

    mouseDownHandler(event: MouseEvent) {
        event.preventDefault();
        const { offsetX, offsetY, button } = event;
        if (button === 0) {
            this.callbacks.mouseDown(this.sx(offsetX), this.sy(offsetY));
        }
    }

    mouseUpHandler(event: MouseEvent) {
        event.preventDefault();
        const { offsetX, offsetY, button } = event;
        if (button === 0) {
            this.callbacks.mouseUp(this.sx(offsetX), this.sy(offsetY));
        }
    }

    mouseLeaveHandler() {
        this.dx = 0;
        this.dy = 0;
        if (this.callbacks.mouseLeave) {
            this.callbacks.mouseLeave();
        }
    }

    // перевод в экранные координаты
    xs(x: number): number {
        return (x - this.WINDOW.LEFT) / this.WINDOW.WIDTH * this.WIDTH;
    }
    ys(y: number): number {
        //return this.HEIGHT - (y - this.WINDOW.TOP) / this.WINDOW.HEIGHT * this.HEIGHT;
        return (y - this.WINDOW.TOP) / this.WINDOW.HEIGHT * this.HEIGHT; // пришлось рисовать так, потому что тайлед отдаёт в таком сраном формате
    }
    // перевод из экранных координат в локальные
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
        if (!this.contextV) return;
        this.contextV.fillStyle = '#305160';
        this.contextV.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    }

    clearImage(image: HTMLImageElement): void {
        if (!this.contextV) return;
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

    circle(x: number, y: number, radius: number, color: string): void {
        if (!this.contextV) return;
        this.contextV.beginPath();
        this.contextV.arc(this.xs(x), this.ys(y), radius, 0, Math.PI * 2);
        this.contextV.fillStyle = color;
        this.contextV.fill();
        this.contextV.closePath();
    }

    text(x: number, y: number, text: string, color = '#fff', font = 'bold 1rem Arial'): void {
        if (!this.contextV) return;
        this.contextV.fillStyle = color;
        this.contextV.font = font;
        this.contextV.fillText(text, this.xs(x), this.ys(y));
    }

    rect(x: number, y: number, size = 64, color = '#f004'): void {
        this.contextV.fillStyle = color;
        this.contextV.fillRect(this.xs(x), this.ys(y), size, size)
    }

    // прямоугольник. НЕ квадрат
    rectangle(x: number, y: number, width = 64, height = 64, color = '#f004'): void {
        if (!this.contextV) return;
        this.contextV.fillStyle = color;
        this.contextV.fillRect(this.xs(x), this.ys(y), width, height);
    }

    spriteFull(image: HTMLImageElement, dx: number, dy: number, sx: number, sy: number, size: number): void {
        if (!this.contextV) return;
        this.contextV.drawImage(image, sx, sy, size, size, this.xs(dx), this.ys(dy), size, size);
    }

    // копируем изображение с виртуального канваса на основной
    render(): void {
        if (!this.contextV) return;
        this.context.drawImage(this.canvasV, 0, 0);
    }
}

export default Canvas;