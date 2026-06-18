'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Info } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface SensoryLog {
  id: string;
  timestamp: string;
  mood?: 'feliz' | 'calmo' | 'agitado' | 'triste';
  crisisOccurred: boolean;
  notes?: string;
  decibels?: number;
  lightLevel?: string;
  location?: string;
  trigger?: string;
  antecedent?: string;
  behavior?: string;
  consequence?: string;
  loggedBy?: 'parent' | 'child' | 'school';
  latitude?: number;
  longitude?: number;
}

interface SensoryHeatmapProps {
  logs: SensoryLog[];
}

export const SensoryHeatmap: React.FC<SensoryHeatmapProps> = ({ logs }) => {
  const { locale } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredLog, setHoveredLog] = useState<SensoryLog | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [mappedPoints, setMappedPoints] = useState<Array<{ log: SensoryLog; x: number; y: number; radius: number }>>([]);

  const logsWithCoords = logs.filter(
    (log) => log.latitude !== undefined && log.longitude !== undefined
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let pulseScale = 1;
    let pulseDirection = 1;

    // Define coordinate bounds
    let minLat = -23.5605, maxLat = -23.5405;
    let minLng = -46.6433, maxLng = -46.6233;

    if (logsWithCoords.length > 0) {
      const lats = logsWithCoords.map((l) => l.latitude!);
      const lngs = logsWithCoords.map((l) => l.longitude!);

      const paddingLat = Math.max(0.005, (Math.max(...lats) - Math.min(...lats)) * 0.3);
      const paddingLng = Math.max(0.005, (Math.max(...lngs) - Math.min(...lngs)) * 0.3);

      minLat = Math.min(...lats) - paddingLat;
      maxLat = Math.max(...lats) + paddingLat;
      minLng = Math.min(...lngs) - paddingLng;
      maxLng = Math.max(...lngs) + paddingLng;
    }

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      // Update pulse animation
      pulseScale += 0.008 * pulseDirection;
      if (pulseScale > 1.25) pulseDirection = -1;
      if (pulseScale < 0.75) pulseDirection = 1;

      // 1. Draw stylized blueprint/abstract map background grid
      ctx.fillStyle = '#f8fafc'; // background slate-50
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#e2e8f0'; // slate-200
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Compass or Radar-like background sweep circles
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.06)'; // indigo-600 very light
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Coordinates labels
      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.font = '8px Nunito';
      ctx.fillText(`Lat: ${minLat.toFixed(4)} ... ${maxLat.toFixed(4)}`, 10, 15);
      ctx.fillText(`Lng: ${minLng.toFixed(4)} ... ${maxLng.toFixed(4)}`, 10, 27);
      ctx.fillText('Mapa de Calor de Desregulação Sensorial (GPS)', width - 180, 15);

      // 2. Map coordinates and plot them
      const points: Array<{ log: SensoryLog; x: number; y: number; radius: number }> = [];

      logsWithCoords.forEach((log) => {
        const pctX = (log.longitude! - minLng) / (maxLng - minLng);
        const pctY = 1 - (log.latitude! - minLat) / (maxLat - minLat); // Invert Y for screen coordinates

        const x = pctX * width;
        const y = pctY * height;

        // Base radius depends on noise/severity (decibels if available, otherwise fixed)
        const intensityFactor = log.decibels ? Math.min(2.5, log.decibels / 45) : 1.2;
        const radius = 25 * intensityFactor * pulseScale;

        // Save for hit-testing
        points.push({ log, x, y, radius: radius / pulseScale });

        // Draw heat halo (radial gradient)
        const grad = ctx.createRadialGradient(x, y, 2, x, y, radius);
        if (log.crisisOccurred) {
          // Red glowing crisis hotspot
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.7)'); // red-500
          grad.addColorStop(0.2, 'rgba(244, 63, 94, 0.45)'); // rose-500
          grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.2)'); // orange-500
          grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
        } else {
          // Teal/Emerald calm communication point
          grad.addColorStop(0, 'rgba(16, 185, 129, 0.6)'); // emerald-500
          grad.addColorStop(0.4, 'rgba(20, 184, 166, 0.3)'); // teal-500
          grad.addColorStop(1, 'rgba(20, 184, 166, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw point center core dot
        ctx.fillStyle = log.crisisOccurred ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw outer ring
        ctx.strokeStyle = log.crisisOccurred ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 6 * pulseScale, 0, Math.PI * 2);
        ctx.stroke();

        // Label location if available
        if (log.location) {
          ctx.fillStyle = '#475569'; // slate-600
          ctx.font = 'bold 8px Outfit';
          ctx.textAlign = 'center';
          ctx.fillText(log.location, x, y - 8);
        }
      });

      setMappedPoints(points);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [logs]);

  // Handle hover tooltips
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Normalize mouse coords
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Find closest point
    let closestPoint: typeof mappedPoints[0] | null = null;
    let minDistance = 20; // 20px threshold

    mappedPoints.forEach((pt) => {
      const dist = Math.sqrt((pt.x - mouseX) ** 2 + (pt.y - mouseY) ** 2);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = pt;
      }
    });

    if (closestPoint) {
      setHoveredLog((closestPoint as any).log);
      
      // Calculate tooltip position (absolute relative to container)
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setTooltipPos({
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top - 10, // slightly above cursor
        });
      }
    } else {
      setHoveredLog(null);
      setTooltipPos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredLog(null);
    setTooltipPos(null);
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xxs">
      {logsWithCoords.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[280px] p-6 text-center text-slate-400 bg-slate-50 gap-3">
          <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-sm text-lg">
            🗺️
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">
              {locale === 'en' ? 'No GPS Coordinates Registered' : locale === 'es' ? 'Sin Coordenadas GPS Registradas' : 'Sem Coordenadas GPS Registradas'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
              {locale === 'en' ? 'Register crises using the sensory log to capture geolocation and generate the heatmap.' : locale === 'es' ? 'Registre las crisis utilizando el diario sensorial para capturar la geolocalización y generar el mapa de calor.' : 'Registre crises usando o diário sensorial para capturar a geolocalização e gerar o mapa de calor.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={600}
            height={280}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full h-[280px] block cursor-crosshair bg-slate-50"
          />

          {/* HTML Overlay Tooltip */}
          {hoveredLog && tooltipPos && (
            <div
              style={{
                position: 'absolute',
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                transform: 'translate(-50%, -100%)',
              }}
              className="z-50 w-56 bg-slate-900/95 text-white p-3.5 rounded-2xl text-[10px] leading-relaxed shadow-lg border border-slate-700/50 backdrop-blur-md pointer-events-none select-none text-left flex flex-col gap-1.5 font-Nunito font-medium transition-all"
            >
              <div className="flex justify-between items-center font-Outfit font-bold uppercase tracking-wider text-[8px] text-indigo-300 border-b border-slate-750 pb-1">
                <span>
                  📍 {
                    hoveredLog.location === 'Escola' ? (locale === 'en' ? 'School' : locale === 'es' ? 'Escuela' : 'Escola') :
                    hoveredLog.location === 'Casa' ? (locale === 'en' ? 'Home' : locale === 'es' ? 'Casa' : 'Casa') :
                    hoveredLog.location === 'Consultório' ? (locale === 'en' ? 'Clinic' : locale === 'es' ? 'Consultorio' : 'Consultório') :
                    (hoveredLog.location || (locale === 'en' ? 'Unknown Location' : locale === 'es' ? 'Lugar No Informado' : 'Local Não Informado'))
                  }
                </span>
                <span>
                  {hoveredLog.crisisOccurred 
                    ? (locale === 'en' ? '🔴 CRISIS' : locale === 'es' ? '🔴 CRISIS' : '🔴 CRISE') 
                    : (locale === 'en' ? '🟢 REGULATED' : locale === 'es' ? '🟢 REGULADO' : '🟢 REGULADO')
                  }
                </span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-350">{new Date(hoveredLog.timestamp).toLocaleString(locale)}</p>
                <p className="font-semibold text-white mt-1 leading-normal">
                  "{hoveredLog.notes || (locale === 'en' ? 'No observations' : locale === 'es' ? 'Sin observaciones' : 'Sem observações')}"
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-750 text-[9px] font-extrabold text-slate-300">
                {hoveredLog.decibels !== undefined && (
                  <span>
                    🔊 {locale === 'en' ? 'Sound' : locale === 'es' ? 'Sonido' : 'Som'}: {hoveredLog.decibels}dB
                  </span>
                )}
                {hoveredLog.lightLevel && (
                  <span>
                    💡 {locale === 'en' ? 'Light' : locale === 'es' ? 'Luz' : 'Luz'}: {
                      hoveredLog.lightLevel === 'Alta' ? (locale === 'en' ? 'High' : locale === 'es' ? 'Alta' : 'Alta') :
                      hoveredLog.lightLevel === 'Média' ? (locale === 'en' ? 'Medium' : locale === 'es' ? 'Media' : 'Média') :
                      hoveredLog.lightLevel === 'Baixa' ? (locale === 'en' ? 'Low' : locale === 'es' ? 'Baja' : 'Baixa') :
                      hoveredLog.lightLevel
                    }
                  </span>
                )}
                {hoveredLog.trigger && (
                  <span className="col-span-2">
                    🎯 {locale === 'en' ? 'Trigger' : locale === 'es' ? 'Desencadenante' : 'Gatilho'}: {
                      hoveredLog.trigger === 'Nenhum' ? (locale === 'en' ? 'None' : locale === 'es' ? 'Ninguno' : 'Nenhum') :
                      hoveredLog.trigger === 'Barulho Elevado' ? (locale === 'en' ? 'High Noise' : locale === 'es' ? 'Ruido Elevado' : 'Barulho Elevado') :
                      hoveredLog.trigger === 'Luz Estroboscópica / Forte' ? (locale === 'en' ? 'Strobe / Strong Light' : locale === 'es' ? 'Luz Estroboscópica / Fuerte' : 'Luz Estroboscópica / Forte') :
                      hoveredLog.trigger === 'Transição de Atividade' ? (locale === 'en' ? 'Activity Transition' : locale === 'es' ? 'Transición de Actividad' : 'Transição de Atividade') :
                      hoveredLog.trigger === 'Multidão' ? (locale === 'en' ? 'Crowd' : locale === 'es' ? 'Multitud' : 'Multidão') :
                      hoveredLog.trigger
                    }
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 border border-slate-200 rounded-full px-2 py-1 shadow-sm pointer-events-none select-none text-[8px] font-bold text-slate-500 backdrop-blur-xxs">
            <Info className="w-3 h-3 text-slate-400" />
            <span>
              {locale === 'en' ? 'Hover over points to see details' : locale === 'es' ? 'Pase el mouse sobre los puntos para ver detalles' : 'Passe o mouse nos pontos para ver detalhes'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
