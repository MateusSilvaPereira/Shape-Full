import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselImage {
  src: string;
  alt: string;
}

interface CarouselProps {
  images: CarouselImage[];
  intervalMs?: number;
  className?: string;
}

export function Carousel({ images, intervalMs = 5000, className }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [images.length, intervalMs, paused, index]);

  if (images.length === 0) return null;

  function goTo(next: number) {
    setIndex((next + images.length) % images.length);
  }

  return (
    <div
      className={"gallery-carousel " + (className ?? "")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((image, i) => (
        <img
          key={image.src}
          src={image.src}
          alt={image.alt}
          className={"gallery-slide " + (i === index ? "active" : "")}
        />
      ))}
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="gallery-arrow left"
            onClick={() => goTo(index - 1)}
            aria-label="Foto anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="gallery-arrow right"
            onClick={() => goTo(index + 1)}
            aria-label="Próxima foto"
          >
            <ChevronRight size={18} />
          </button>
          <div className="gallery-dots">
            {images.map((image, i) => (
              <button
                key={image.src}
                type="button"
                className={"gallery-dot " + (i === index ? "active" : "")}
                onClick={() => goTo(i)}
                aria-label={`Ir para foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
