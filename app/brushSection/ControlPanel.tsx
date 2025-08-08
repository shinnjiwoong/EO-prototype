'use client';

import { useEffect } from 'react';

interface ControlPanelProps {
    onUpload: (e: any) => void;
    size: number;
    onSizeChange: (value: number) => void;
    rotation: number;
    onRotationChange: (value: number) => void;
    randomness: number;
    onRandomnessChange: (value: number) => void;
    drawInterval: number;
    onDrawIntervalChange: (value: number) => void;
    onSaveImage: () => void;
    onClearCanvas: () => void;
    showPanel: boolean;
    setShowPanel: (show: boolean) => void;
}

export default function ControlPanel({
    onUpload,
    size,
    onSizeChange,
    rotation,
    onRotationChange,
    randomness,
    onRandomnessChange,
    drawInterval,
    onDrawIntervalChange,
    onSaveImage,
    onClearCanvas,
    showPanel,
    setShowPanel,
}: ControlPanelProps) {
    const updateSliderBackground = (element: HTMLInputElement) => {
        const min = parseFloat(element.min);
        const max = parseFloat(element.max);
        const value = parseFloat(element.value);
        const percentage = ((value - min) / (max - min)) * 100;
        element.style.background = `linear-gradient(to right, #000000 0%, #000000 ${percentage}%, #000000 ${percentage}%, #000000 100%)`;
    };

    useEffect(() => {
        const sliders = document.querySelectorAll(
            '.slider'
        ) as NodeListOf<HTMLInputElement>;
        sliders.forEach((slider) => {
            updateSliderBackground(slider);
            slider.addEventListener('input', (e) => {
                updateSliderBackground(e.target as HTMLInputElement);
            });
        });

        return () => {
            sliders.forEach((slider) => {
                slider.removeEventListener('input', (e) => {
                    updateSliderBackground(e.target as HTMLInputElement);
                });
            });
        };
    }, [size, rotation, randomness, drawInterval]);

    return (
        <div
            className={`controls fixed top-[16px] left-[16px] right-0 flex flex-col gap-6 transition-opacity duration-300 ${
                showPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
            <h2 className="text-black text-[1.2rem]">Brush Controls</h2>
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4 w-full">
                    <label className="text-black">Size</label>
                    <input
                        type="range"
                        min={10}
                        max={200}
                        value={size}
                        onChange={(e) => onSizeChange(+e.target.value)}
                        className="w-full h-[1px] bg-black rounded-lg appearance-none cursor-pointer slider"
                    />
                </div>

                <div className="flex flex-col gap-4 w-full">
                    <label className="text-black">Rotation</label>
                    <input
                        type="range"
                        min={0}
                        max={6.28}
                        step={0.01}
                        value={rotation}
                        onChange={(e) => onRotationChange(+e.target.value)}
                        className="w-full h-[1px] bg-black rounded-lg appearance-none cursor-pointer slider"
                    />
                </div>

                <div className="flex flex-col gap-4 w-full">
                    <label className="text-black">Randomness</label>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={randomness}
                        onChange={(e) => onRandomnessChange(+e.target.value)}
                        className="w-full h-[1px] bg-black rounded-lg appearance-none cursor-pointer slider"
                    />
                </div>

                <div className="flex flex-col gap-4 w-full">
                    <label className="text-black">Draw Interval (ms)</label>
                    <input
                        type="range"
                        min={10}
                        max={200}
                        value={drawInterval}
                        onChange={(e) => onDrawIntervalChange(+e.target.value)}
                        className="w-full h-[1px] bg-black rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-black">{drawInterval}ms</span>
                </div>
            </div>

            <div className="flex flex-col gap-2 w-fit">
                <div className="flex flex-row gap-2">
                    <div className="flex flex-row gap-2 w-fit cursor-pointer px-[12px] py-[4px] border border-black bg-[#72FF65] hover:bg-gray-100">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="text-black cursor-pointer"
                        >
                            Upload Image
                        </label>
                        <img
                            src="/drive_folder_upload.svg"
                            alt=""
                            className="w-[1.2rem] h-auto"
                        />
                    </div>
                    <button
                        className="text-black px-[12px] py-[4px] border border-black bg-[#72FF65] hover:bg-gray-100"
                        onClick={onSaveImage}
                    >
                        Save Image
                    </button>
                </div>

                <button
                    className="text-black px-[12px] py-[4px] border border-black bg-[#72FF65] hover:bg-gray-100"
                    onClick={onClearCanvas}
                >
                    Clear Canvas
                </button>
            </div>
        </div>
    );
}
