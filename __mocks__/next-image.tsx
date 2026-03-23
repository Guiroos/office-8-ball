import React from "react";

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
};

export default function Image({ src, alt, width, height, className, onError }: Props) {
  return <img src={src} alt={alt} width={width} height={height} className={className} onError={onError} />;
}
