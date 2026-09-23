/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import { useState } from "react";

interface MenuImageProps {
  src: string;
  alt: string;
  emoji: string;
  size?: number;
}

export function MenuImage({ src, alt, emoji, size = 72 }: MenuImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !src || failedSrc === src;

  if (failed) {
    return (
      <span className="emoji" style={{ fontSize: Math.round(size * 0.55) }}>
        {emoji}
      </span>
    );
  }

  const style: React.CSSProperties = {
    borderRadius: 12,
    objectFit: "cover",
    flexShrink: 0,
  };

  if (src.startsWith("data:")) {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={style}
        onError={() => setFailedSrc(src)}
        onLoad={() => setFailedSrc(null)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      style={style}
      onError={() => setFailedSrc(src)}
      onLoad={() => setFailedSrc(null)}
    />
  );
}