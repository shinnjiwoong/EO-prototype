'use client';

import BrushScreen from './brushSection/brushScreen';
import Header from './Header';

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <BrushScreen />
        </div>
    );
}
