"use client";

import { RefObject, useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  city: string;
  portrait: HTMLImageElement | null;
  canvasRef: RefObject<HTMLCanvasElement>;
};

type Assets = { logo?: HTMLImageElement; qr?: HTMLImageElement; bas?: HTMLImageElement };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function draw(canvas: HTMLCanvasElement, a: Assets, nameRaw: string, cityRaw: string, portrait: HTMLImageElement | null) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = 1200, H = 1200;
  ctx.clearRect(0, 0, W, H);

  // Fond
  ctx.fillStyle = "#16456f";
  ctx.fillRect(0, 0, W, H);

  // Plaque logo
  ctx.fillStyle = "#f5f7f9";
  ctx.beginPath();
  ctx.roundRect(66, 55, 150, 155, 10);
  ctx.fill();
  if (a.logo) ctx.drawImage(a.logo, 82, 70, 128, 135);
  else {
    ctx.fillStyle = "#16456f";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ABIFA", 140, 132);
  }

  // Site web
  ctx.fillStyle = "#f5f7fb";
  ctx.font = "30px Arial";
  ctx.textAlign = "right";
  ctx.fillText("abifadagori.com", 1130, 150);

  // Bloc titre
  ctx.textAlign = "left";
  ctx.fillStyle = "#f4f6fa";
  ctx.font = "44px Arial";
  ctx.fillText("Je participe au", 78, 310);
  ctx.font = "bold 72px Arial";
  ctx.fillText("Hackathon", 78, 395);
  ctx.font = "bold 124px Arial";
  ctx.fillText("ABIFA", 78, 500);
  ctx.fillStyle = "#f58227";
  ctx.fillText("2026", 78, 620);
  ctx.fillStyle = "#f4f6fa";
  ctx.font = "34px Arial";
  ctx.fillText("Première édition", 78, 670);

  // Portrait
  const cx = 860, cy = 470, r = 200;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.clip();
  if (portrait) {
    drawCover(ctx, portrait, cx - (r - 8), cy - (r - 8), (r - 8) * 2, (r - 8) * 2);
  } else {
    ctx.fillStyle = "#16456f";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "#dce8f1";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Votre photo ici", cx, cy + 12);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#f58227";
  ctx.lineWidth = 11;
  ctx.stroke();

  // Informations du participant
  const name = nameRaw.trim() || "Prénom NOM";
  const city = cityRaw.trim() || "Ville, Pays";
  ctx.textAlign = "left";
  ctx.fillStyle = "#f5f7fb";
  const nameSize = Math.min(78, Math.max(38, 700 / (name.length * 0.55)));
  ctx.font = "bold " + nameSize + "px Arial";
  ctx.fillText(name, 78, 870, 950);
  ctx.fillStyle = "#d8e3ed";
  ctx.font = "36px Arial";
  ctx.fillText(city, 78, 910, 950);

  // Pied de page
  ctx.fillStyle = "#f3f6f9";
  ctx.fillRect(0, 1000, 1200, 150);
  ctx.fillStyle = "#f58227";
  ctx.fillRect(0, 1000, 1200, 8);
  ctx.fillStyle = "#16456f";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";
  ctx.fillText("FORMATION · INNOVATION · ENTREPRENEURIAT", 200, 1060);
  if (a.bas) ctx.drawImage(a.bas, 90, 1040, 70, 70);
  ctx.fillStyle = "#283746";
  ctx.font = "24px Arial";
  ctx.fillText("abifadagori.com · Agori, Bénin", 200, 1100);

  // QR code
  if (a.qr) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(1052, 1020, 110, 110);
    ctx.drawImage(a.qr, 1056, 1024, 100, 100);
  }
}

export default function PosterCanvas({ name, city, portrait, canvasRef }: Props) {
  const assets = useRef<Assets>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      loadImage("/image/logo.png").then((i) => (assets.current.logo = i)),
      loadImage("/image/qr_code.png").then((i) => (assets.current.qr = i)),
      loadImage("/image/bas.png").then((i) => (assets.current.bas = i)),
    ]).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, assets.current, name, city, portrait);
  }, [name, city, portrait, ready, canvasRef]);

  return <canvas ref={canvasRef} width={1200} height={1200} className="poster-canvas" aria-label="Aperçu de l'affiche" />;
}
