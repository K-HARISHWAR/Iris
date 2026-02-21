import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface IrisScannerProps {
  image: string;
  isScanning: boolean;
}

export function IrisScanner({ image, isScanning }: IrisScannerProps) {
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (isScanning) {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2.5;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isScanning]);

  return (
    <div className="relative w-full h-96 bg-slate-900 rounded-lg overflow-hidden">
      {/* Background Image */}
      <img
        src={image}
        alt="Iris scan"
        className="w-full h-full object-cover opacity-90"
      />

      {/* Scanning Overlay */}
      {isScanning && (
        <>
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-slate-900/60" />

          {/* Iris Mask with 8 Sectors */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64">
              {/* Outer Circle */}
              <motion.svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 256 256"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Main Circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="opacity-80"
                />

                {/* 8 Sector Lines */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i * 45 * Math.PI) / 180;
                  const x1 = 128 + Math.cos(angle) * 50;
                  const y1 = 128 + Math.sin(angle) * 50;
                  const x2 = 128 + Math.cos(angle) * 120;
                  const y2 = 128 + Math.sin(angle) * 120;

                  return (
                    <motion.line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#3b82f6"
                      strokeWidth="1"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    />
                  );
                })}

                {/* Inner Circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="50"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="opacity-80"
                />

                {/* Rotating Scan Line */}
                <motion.line
                  x1="128"
                  y1="128"
                  x2="128"
                  y2="8"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ transformOrigin: "128px 128px" }}
                />
              </motion.svg>

              {/* Sector Labels */}
              {[
                { label: "Top", angle: -90, distance: 140 },
                { label: "Top-Right", angle: -45, distance: 155 },
                { label: "Right", angle: 0, distance: 140 },
                { label: "Bottom-Right", angle: 45, distance: 165 },
                { label: "Bottom", angle: 90, distance: 140 },
                { label: "Bottom-Left", angle: 135, distance: 165 },
                { label: "Left", angle: 180, distance: 140 },
                { label: "Top-Left", angle: -135, distance: 155 },
              ].map((sector, i) => {
                const angleRad = (sector.angle * Math.PI) / 180;
                const x = 128 + Math.cos(angleRad) * sector.distance;
                const y = 128 + Math.sin(angleRad) * sector.distance;

                return (
                  <motion.div
                    key={i}
                    className="absolute text-xs font-mono text-blue-400 whitespace-nowrap"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                  >
                    S{i + 1}
                  </motion.div>
                );
              })}

              {/* Pulsing Center Dot */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-500 rounded-full"
                style={{ transform: "translate(-50%, -50%)" }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>

          {/* Scanning Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-400 font-medium">Analyzing Iris Sectors...</span>
                <span className="text-white font-mono">{Math.round(scanProgress)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </div>

          {/* Scanning Grid Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(0deg, transparent 24%, rgba(59, 130, 246, 0.05) 25%, rgba(59, 130, 246, 0.05) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, 0.05) 75%, rgba(59, 130, 246, 0.05) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(59, 130, 246, 0.05) 25%, rgba(59, 130, 246, 0.05) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, 0.05) 75%, rgba(59, 130, 246, 0.05) 76%, transparent 77%, transparent)
              `,
              backgroundSize: "50px 50px",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}
    </div>
  );
}
