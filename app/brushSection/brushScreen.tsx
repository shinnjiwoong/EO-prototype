'use client';

import { useRef, useState, useEffect } from 'react';
import ControlPanel from './ControlPanel';
import SelectCanvas, { CanvasType } from '../SelectCanvas';

const CANVAS_SIZES: Record<CanvasType, { width: number; height: number }> = {
    poster: { width: 800, height: 1200 },
    pc: { width: 1200, height: 800 },
    mobile: { width: 400, height: 800 },
    square: { width: 800, height: 800 },
    fullscreen: { width: window.innerWidth, height: window.innerHeight },
};

export default function BrushScreen() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const [drawing, setDrawing] = useState(false);
    const [size, setSize] = useState(50);
    const [rotation, setRotation] = useState(0);
    const [randomness, setRandomness] = useState(0.2);
    const [lastDrawTime, setLastDrawTime] = useState(0);
    const [drawInterval, setDrawInterval] = useState(50); // 그리기 간격 (ms)
    const [showPanel, setShowPanel] = useState(true);
    const [canvasType, setCanvasType] = useState<CanvasType>('pc');
    const [canvasSize, setCanvasSize] = useState(CANVAS_SIZES.pc);
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [isTransparent, setIsTransparent] = useState(false);

    const handleCanvasTypeChange = (type: CanvasType) => {
        setCanvasType(type);
        setCanvasSize(CANVAS_SIZES[type]);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d')!;
            const dpr = window.devicePixelRatio || 1;

            // 캔버스의 CSS 크기 설정
            canvas.style.width = canvasSize.width + 'px';
            canvas.style.height = canvasSize.height + 'px';

            // 캔버스의 실제 크기 설정 (DPI 고려)
            canvas.width = canvasSize.width * dpr;
            canvas.height = canvasSize.height * dpr;

            // 컨텍스트 스케일 조정
            ctx.scale(dpr, dpr);

            // 이미지 스무딩 비활성화 (선명한 픽셀 아트를 위해)
            ctx.imageSmoothingEnabled = false;

            // 캔버스 초기화 (배경 설정에 따라)
            if (!isTransparent) {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
            }
        }
    }, [canvasSize, backgroundColor, isTransparent]);

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            // 캔버스가 아닌 컨트롤 패널 요소를 클릭한 경우 무시
            const target = e.target as HTMLElement;
            if (target.closest('.controls')) {
                return;
            }

            if (e.target === canvasRef.current) {
                setShowPanel(false);
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    useEffect(() => {
        const handleMouseUp = (e: MouseEvent) => {
            // 캔버스가 아닌 컨트롤 패널 요소를 클릭한 경우 무시
            const target = e.target as HTMLElement;
            if (target.closest('.controls')) {
                return;
            }

            if (e.target === canvasRef.current) {
                setShowPanel(true);
            }
        };
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.src = reader.result as string;
            image.onload = () => setImg(image);
        };
        reader.readAsDataURL(file);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawing || !img) return;

        const currentTime = Date.now();
        if (currentTime - lastDrawTime < drawInterval) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;

        // 위치에 랜덤함 추가
        const randomX = x + (Math.random() - 0.5) * randomness * 100;
        const randomY = y + (Math.random() - 0.5) * randomness * 100;

        // 회전은 회전 값에만 영향받음
        const r = rotation;
        const s = size * (1 + (Math.random() - 0.5) * 0.1); // 크기 랜덤함을 고정값으로 변경

        ctx.save();
        ctx.translate(randomX, randomY);
        ctx.rotate(r);

        if (img) {
            // 일반 이미지 그리기
            ctx.drawImage(img, -s / 2, -s / 2, s, s);
        }

        ctx.restore();

        setLastDrawTime(currentTime);
    };

    const saveImage = () => {
        const canvas = canvasRef.current!;
        const dpr = window.devicePixelRatio || 1;

        // 고해상도 이미지를 위한 임시 캔버스 생성
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d')!;

        // 임시 캔버스 크기 설정 (고해상도)
        tempCanvas.width = canvasSize.width * dpr;
        tempCanvas.height = canvasSize.height * dpr;

        // 투명 배경이 아닌 경우 배경색 설정
        if (!isTransparent) {
            tempCtx.fillStyle = backgroundColor;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        // 원본 캔버스의 내용을 임시 캔버스에 복사
        tempCtx.drawImage(canvas, 0, 0);

        // 고해상도 이미지로 저장
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const dpr = window.devicePixelRatio || 1;

        // 캔버스 초기화 (배경 설정에 따라)
        if (!isTransparent) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
        } else {
            ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        }
    };

    return (
        <div
            className={`${
                canvasType === 'fullscreen'
                    ? 'p-0'
                    : 'flex items-center justify-center min-h-screen bg-gray-100 p-8'
            }`}
        >
            <div
                className={`${
                    canvasType === 'fullscreen'
                        ? 'w-full h-screen'
                        : 'relative bg-white shadow-lg'
                }`}
                style={{
                    width:
                        canvasType === 'fullscreen'
                            ? '100vw'
                            : canvasSize.width,
                    height:
                        canvasType === 'fullscreen'
                            ? '100vh'
                            : canvasSize.height,
                    transition: 'width 0.3s ease, height 0.3s ease',
                }}
            >
                <canvas
                    ref={canvasRef}
                    onMouseDown={() => setDrawing(true)}
                    onMouseMove={draw}
                    onMouseUp={() => setDrawing(false)}
                    style={{ cursor: 'crosshair' }}
                />
            </div>
            <SelectCanvas
                onUpload={handleUpload}
                size={size}
                onSizeChange={setSize}
                rotation={rotation}
                onRotationChange={setRotation}
                canvasType={canvasType}
                onCanvasTypeChange={handleCanvasTypeChange}
            />
            <ControlPanel
                onUpload={handleUpload}
                size={size}
                onSizeChange={setSize}
                rotation={rotation}
                onRotationChange={setRotation}
                randomness={randomness}
                onRandomnessChange={setRandomness}
                drawInterval={drawInterval}
                onDrawIntervalChange={setDrawInterval}
                onSaveImage={saveImage}
                onClearCanvas={clearCanvas}
                showPanel={showPanel}
                setShowPanel={setShowPanel}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
                isTransparent={isTransparent}
                onTransparentChange={setIsTransparent}
            />
        </div>
    );
}
