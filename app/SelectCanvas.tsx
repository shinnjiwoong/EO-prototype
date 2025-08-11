'use client';

import { useState, useEffect } from 'react';

export type CanvasType = 'poster' | 'pc' | 'mobile' | 'square' | 'fullscreen';

interface CanvasSize {
    width: number;
    height: number;
}

const CANVAS_SIZES: Record<CanvasType, CanvasSize> = {
    poster: { width: 800, height: 1200 },
    pc: { width: 1200, height: 800 },
    mobile: { width: 400, height: 800 },
    square: { width: 800, height: 800 },
    fullscreen: { width: 0, height: 0 }, // 초기값은 0으로 설정
};

interface SelectCanvasProps {
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    size: number;
    onSizeChange: (value: number) => void;
    rotation: number;
    onRotationChange: (value: number) => void;
    canvasType: CanvasType;
    onCanvasTypeChange: (type: CanvasType) => void;
}

export default function SelectCanvas({
    onUpload,
    size,
    onSizeChange,
    rotation,
    onRotationChange,
    canvasType,
    onCanvasTypeChange,
}: SelectCanvasProps) {
    const [isClient, setIsClient] = useState(false);

    // 클라이언트 사이드에서만 실행
    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="fixed top-[16px] right-[16px] flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-black text-sm">Canvas Type</label>
                <div className="flex flex-row gap-2">
                    {Object.entries(CANVAS_SIZES).map(([type, size]) => {
                        const isActive = canvasType === type;

                        // fullscreen 타입은 특별한 스타일 적용
                        if (type === 'fullscreen') {
                            return (
                                <button
                                    key={type}
                                    onClick={() =>
                                        onCanvasTypeChange(type as CanvasType)
                                    }
                                    className={`relative border-1 transition-all duration-200 border-black bg-black text-white hover:opacity-100 ${
                                        isActive ? 'opacity-100' : 'opacity-50'
                                    }`}
                                    style={{
                                        width: 120,
                                        height: 80,
                                    }}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-medium">
                                            Full
                                        </span>
                                    </div>
                                    {isActive && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#72FF65] rounded-full flex items-center justify-center border-1 border-black"></div>
                                    )}
                                </button>
                            );
                        }

                        const aspectRatio = size.width / size.height;
                        const maxWidth = 120;
                        const maxHeight = 80;

                        // 비율에 따라 크기 계산
                        let displayWidth, displayHeight;
                        if (aspectRatio > 1) {
                            // 가로형
                            displayWidth = maxWidth;
                            displayHeight = maxWidth / aspectRatio;
                        } else {
                            // 세로형
                            displayHeight = maxHeight;
                            displayWidth = maxHeight * aspectRatio;
                        }

                        return (
                            <button
                                key={type}
                                onClick={() =>
                                    onCanvasTypeChange(type as CanvasType)
                                }
                                className={`relative border-1 transition-all duration-200 border-black bg-black text-white hover:opacity-100 ${
                                    isActive ? 'opacity-100' : 'opacity-50'
                                }`}
                                style={{
                                    width: displayWidth,
                                    height: displayHeight,
                                }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-medium">
                                        {type.charAt(0).toUpperCase() +
                                            type.slice(1)}
                                    </span>
                                </div>
                                {isActive && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#72FF65] rounded-full flex items-center justify-center border-1 border-black"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-black text-sm">Brush Size</label>
                <input
                    type="range"
                    min={10}
                    max={200}
                    value={size}
                    onChange={(e) => onSizeChange(+e.target.value)}
                    className="w-full h-[1px] bg-black rounded-lg appearance-none cursor-pointer slider"
                />
            </div>
        </div>
    );
}
