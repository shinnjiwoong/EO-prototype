'use client';

import { useRef, useState, useEffect } from 'react';
import ControlPanel from './ControlPanel';
import SelectCanvas, { CanvasType } from '../SelectCanvas';

const CANVAS_SIZES: Record<CanvasType, { width: number; height: number }> = {
    poster: { width: 800, height: 1200 },
    pc: { width: 1200, height: 800 },
    mobile: { width: 400, height: 800 },
    square: { width: 800, height: 800 },
    fullscreen: { width: 0, height: 0 }, // 초기값은 0으로 설정
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
    const [isClient, setIsClient] = useState(false);

    // 마우스 속도 계산을 위한 상태
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [lastMouseTime, setLastMouseTime] = useState(0);

    // 커서 미리보기용 상태
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [showCursor, setShowCursor] = useState(false);
    const [cursorImageData, setCursorImageData] = useState<string>('');

    // 클라이언트 사이드에서만 실행
    useEffect(() => {
        setIsClient(true);
    }, []);

    // cursorCanvasRef가 설정되었는지 확인
    useEffect(() => {
        console.log('커서 미리보기 상태 확인:', {
            img: !!img,
        });
    }, [img]);

    // 설정이 변경될 때마다 커서 미리보기 업데이트
    useEffect(() => {
        console.log('설정 변경 useEffect:', {
            img: !!img,
            showCursor,
            cursorPos,
            size,
            rotation,
        });

        if (img && showCursor) {
            updateCursorPreview(cursorPos.x, cursorPos.y);
        }
    }, [size, rotation, randomness, img, showCursor]);

    const handleCanvasTypeChange = (type: CanvasType) => {
        if (type === 'fullscreen' && isClient) {
            // fullscreen일 때만 window 크기 사용
            setCanvasSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        } else {
            setCanvasSize(CANVAS_SIZES[type]);
        }
        setCanvasType(type);
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

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setDrawing(true);
        // 마우스 다운 시 초기 위치 설정
        setLastMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
        setLastMouseTime(Date.now());
    };

    // 커서 미리보기 업데이트 함수
    const updateCursorPreview = (x: number, y: number) => {
        console.log('updateCursorPreview 호출:', {
            img: !!img,
            x,
            y,
        });

        if (!img) {
            console.log('이미지가 없음');
            return;
        }

        try {
            // 임시 캔버스를 생성하여 이미지 데이터 생성
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d')!;

            // 마우스 속도에 따른 크기 계산 (부드러운 변화)
            let speedMultiplier = 1;
            if (lastMouseTime > 0) {
                const currentTime = Date.now();
                const timeDiff = currentTime - lastMouseTime;
                const distance = Math.sqrt(
                    Math.pow(x - lastMousePos.x, 2) +
                        Math.pow(y - lastMousePos.y, 2)
                );
                const speed = distance / timeDiff;

                // 속도가 0.1 픽셀/밀리초부터 점진적으로 증가
                if (speed > 0.1) {
                    const normalizedSpeed = Math.min((speed - 0.1) / 2.0, 1.0);
                    const easeOutSpeed = 1 - Math.pow(1 - normalizedSpeed, 3);
                    speedMultiplier = 1 + easeOutSpeed * 1.5;
                }
            }

            // 커서 캔버스 크기 설정 (속도가 적용된 이미지 크기보다 약간 크게)
            const previewSize = Math.max(size * speedMultiplier * 2, 100);
            tempCanvas.width = previewSize;
            tempCanvas.height = previewSize;

            // 배경을 투명하게
            tempCtx.clearRect(0, 0, previewSize, previewSize);

            // 이미지 그리기 (중앙에 위치)
            const centerX = previewSize / 2;
            const centerY = previewSize / 2;

            tempCtx.save();
            tempCtx.translate(centerX, centerY);
            tempCtx.rotate(rotation);

            // 속도가 적용된 크기로 그리기
            const displaySize = size * speedMultiplier;
            tempCtx.drawImage(
                img,
                -displaySize / 2,
                -displaySize / 2,
                displaySize,
                displaySize
            );

            tempCtx.restore();

            // 이미지 데이터를 base64로 변환하여 저장
            const imageData = tempCanvas.toDataURL('image/png');
            setCursorImageData(imageData);

            // 랜덤함이 적용된 실제 그려질 위치 계산
            const randomX = x + (Math.random() - 0.5) * randomness * 100;
            const randomY = y + (Math.random() - 0.5) * randomness * 100;

            // 커서 위치와 표시 상태를 즉시 업데이트
            setCursorPos({ x: randomX, y: randomY });
            setShowCursor(true);

            console.log('커서 미리보기 성공:', {
                x: randomX,
                y: randomY,
                size: displaySize,
                rotation,
                speedMultiplier,
            });
        } catch (error) {
            console.error('커서 미리보기 그리기 중 에러:', error);
        }
    };

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
        const currentX = e.nativeEvent.offsetX;
        const currentY = e.nativeEvent.offsetY;
        const currentTime2 = Date.now();

        // 마우스 속도 계산
        let speedMultiplier = 1;
        if (lastMouseTime > 0) {
            const timeDiff = currentTime2 - lastMouseTime;
            const distance = Math.sqrt(
                Math.pow(currentX - lastMousePos.x, 2) +
                    Math.pow(currentY - lastMousePos.y, 2)
            );
            const speed = distance / timeDiff; // 픽셀/밀리초

            // 속도에 따른 크기 조정을 더 부드럽게 개선
            // 속도가 0.1 픽셀/밀리초부터 점진적으로 증가
            if (speed > 0.1) {
                // 부드러운 곡선 함수 사용 (ease-out 효과)
                const normalizedSpeed = Math.min((speed - 0.1) / 2.0, 1.0); // 0~1 범위로 정규화
                const easeOutSpeed = 1 - Math.pow(1 - normalizedSpeed, 3); // cubic ease-out
                speedMultiplier = 1 + easeOutSpeed * 1.5; // 최대 2.5배까지 부드럽게 증가
            }
        }

        // 위치에 랜덤함 추가
        const randomX = currentX + (Math.random() - 0.5) * randomness * 100;
        const randomY = currentY + (Math.random() - 0.5) * randomness * 100;

        // 회전은 회전 값에만 영향받음
        const r = rotation;
        // 크기에 속도 배수와 랜덤함 적용
        const s = size * speedMultiplier * (1 + (Math.random() - 0.5) * 0.1);

        ctx.save();
        ctx.translate(randomX, randomY);
        ctx.rotate(r);

        if (img) {
            // 일반 이미지 그리기
            ctx.drawImage(img, -s / 2, -s / 2, s, s);
        }

        ctx.restore();

        // 마우스 위치와 시간 업데이트
        setLastMousePos({ x: currentX, y: currentY });
        setLastMouseTime(currentTime2);
        setLastDrawTime(currentTime);
    };

    // 마우스 움직임 추적 (그리기와 관계없이)
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        console.log('handleMouseMove 호출:', {
            img: !!img,
            drawing,
            clientX: e.clientX,
            clientY: e.clientY,
        });

        if (img) {
            // 마우스 위치를 전역 좌표로 변환
            const rect = e.currentTarget.getBoundingClientRect();
            const globalX = e.clientX;
            const globalY = e.clientY;

            console.log('마우스 움직임:', { globalX, globalY, img: !!img });

            updateCursorPreview(globalX, globalY);

            // 그리기 중일 때만 실제 그리기 실행
            if (drawing) {
                draw(e);
            }
        } else {
            console.log(
                '이미지가 없거나 커서 캔버스 ref가 없어서 커서 미리보기 업데이트 안함'
            );
        }
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
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={() => setDrawing(false)}
                    onMouseLeave={() => setShowCursor(false)}
                    style={{ cursor: 'crosshair' }}
                />
            </div>

            {/* 커서 미리보기 */}
            {showCursor && img && cursorImageData && (
                <img
                    src={cursorImageData}
                    className="fixed pointer-events-none z-[9999] border border-red-500"
                    style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                    alt="커서 미리보기"
                />
            )}

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
