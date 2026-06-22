import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator = ({ value, size = 200 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !value) return;

        // Render QR Code onto the Canvas with custom styles
        QRCode.toCanvas(
            canvasRef.current,
            value,
            {
                width: size,
                margin: 2,
                color: {
                    dark: '#0f172a',  // deep slate color
                    light: '#ffffff'  // white background
                }
            },
            (error) => {
                if (error) console.error('Error generating QR Code:', error);
            }
        );
    }, [value, size]);

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-[2rem] shadow-inner border border-slate-100 dark:border-slate-800/60 w-fit mx-auto">
            <canvas ref={canvasRef} className="rounded-xl max-w-full" />
        </div>
    );
};

export default QRCodeGenerator;
