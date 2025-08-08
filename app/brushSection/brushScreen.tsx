'use client';

import { useRef, useState, useEffect } from 'react';
import ControlPanel from './ControlPanel';

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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d')!;
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            // 캔버스의 CSS 크기 설정
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';

            // 캔버스의 실제 크기 설정 (DPI 고려)
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;

            // 컨텍스트 스케일 조정
            ctx.scale(dpr, dpr);

            // 이미지 스무딩 비활성화 (선명한 픽셀 아트를 위해)
            ctx.imageSmoothingEnabled = false;
        }
    }, []);
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
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                onMouseDown={() => setDrawing(true)}
                onMouseMove={draw}
                onMouseUp={() => setDrawing(false)}
                style={{ cursor: 'crosshair' }}
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
            />
        </div>
    );
}
