import { useRef, useState, useEffect, useCallback } from "react";

export const FONT_OPTIONS = [
    { value: "dancing", label: "Dancing Script", family: "'Dancing Script', cursive" },
    { value: "great-vibes", label: "Great Vibes", family: "'Great Vibes', cursive" },
    { value: "pacifico", label: "Pacifico", family: "'Pacifico', cursive" },
    { value: "satisfy", label: "Satisfy", family: "'Satisfy', cursive" },
    { value: "allura", label: "Allura", family: "'Allura', cursive" },
    { value: "caveat", label: "Caveat", family: "'Caveat', cursive" },
    { value: "sacramento", label: "Sacramento", family: "'Sacramento', cursive" },
];

export const useSignatureCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    const initializeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, rect.width, rect.height);
        }
        setHasDrawn(false);
    }, []);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear everything first
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, rect.width, rect.height);
        }
        setHasDrawn(false);
    }, []);

    const loadImageOnCanvas = useCallback((imageUrl: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasDrawn(true);
        };
        img.src = imageUrl;
    }, []);

    const renderTextSignature = useCallback((text: string, selectedFont: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        clearCanvas();
        const trimmed = text.trim();
        if (!trimmed) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();

        const fontOption = FONT_OPTIONS.find(f => f.value === selectedFont);
        const fontFamily = fontOption?.family || "'Dancing Script', cursive";

        // Dynamic font sizing
        const MAX_FONT_SIZE = 170;
        const MIN_FONT_SIZE = 40;
        const PADDING = 40;
        const availableWidth = rect.width - PADDING; // Use rect.width (logical width)

        // Start with max font size
        let fontSize = MAX_FONT_SIZE;
        ctx.font = `${fontSize}px ${fontFamily}`;

        // Measure text
        const textMetrics = ctx.measureText(trimmed);
        const textWidth = textMetrics.width;

        // Scale down if needed
        if (textWidth > availableWidth) {
            fontSize = Math.floor((availableWidth / textWidth) * fontSize);
            // Clamp to min font size
            fontSize = Math.max(fontSize, MIN_FONT_SIZE);
        }

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const x = rect.width / 2;
        const y = rect.height / 2;

        ctx.fillText(trimmed, x, y);
        setHasDrawn(true);
    }, [clearCanvas]);

    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        e.preventDefault();
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x: number, y: number;

        if ("touches" in e) {
            const touch = e.touches[0];
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
    }, []);

    useEffect(() => {
        if (!isDrawing) return;

        const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
            if (!canvasRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const rect = canvas.getBoundingClientRect();
            let x: number, y: number;

            if (e instanceof TouchEvent) {
                const touch = e.touches[0];
                x = touch.clientX - rect.left;
                y = touch.clientY - rect.top;
            } else {
                x = e.clientX - rect.left;
                y = e.clientY - rect.top;
            }

            ctx.lineTo(x, y);
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();

            if (!hasDrawn) {
                setHasDrawn(true);
            }
        };

        const handleGlobalEnd = () => {
            setIsDrawing(false);
        };

        window.addEventListener("mousemove", handleGlobalMove);
        window.addEventListener("mouseup", handleGlobalEnd);
        window.addEventListener("touchmove", handleGlobalMove);
        window.addEventListener("touchend", handleGlobalEnd);

        return () => {
            window.removeEventListener("mousemove", handleGlobalMove);
            window.removeEventListener("mouseup", handleGlobalEnd);
            window.removeEventListener("touchmove", handleGlobalMove);
            window.removeEventListener("touchend", handleGlobalEnd);
        };
    }, [isDrawing, hasDrawn]);

    return {
        canvasRef,
        isDrawing,
        hasDrawn,
        setHasDrawn,
        initializeCanvas,
        clearCanvas,
        loadImageOnCanvas,
        renderTextSignature,
        startDrawing
    };
};
