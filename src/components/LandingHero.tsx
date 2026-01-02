"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { Button } from "@/components/ui/button";

export default function LandingHero({ onStartScouting }: { onStartScouting: () => void }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const bulletsRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    animate([titleRef.current, subtitleRef.current, bulletsRef.current, buttonRef.current], {
      translateY: [20, 0],
      opacity: [0, 1],
      delay: stagger(200),
      easing: "easeOutQuad",
      duration: 800,
    });
  }, []);

  const handleStart = () => {
    if (buttonRef.current) {
      animate(buttonRef.current, {
        scale: [1, 0.95, 1],
        duration: 200,
        easing: "easeInOutQuad",
        onComplete: onStartScouting,
      });
    } else {
      onStartScouting();
    }
  };

  return (
    <section 
      ref={heroRef}
      className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 bg-gradient-to-b from-background to-muted/50"
    >
      <h1 
        ref={titleRef}
        className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600"
      >
        Prep Page
      </h1>
      <p 
        ref={subtitleRef}
        className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl"
      >
        Know your opponent in 30 seconds.
      </p>
      
      <ul 
        ref={bulletsRef}
        className="text-left space-y-3 mb-12 text-lg text-muted-foreground"
      >
        <li className="flex items-center">
          <span className="mr-3 text-primary">1.</span> Enter an opponent team.
        </li>
        <li className="flex items-center">
          <span className="mr-3 text-primary">2.</span> We fetch their GRID match history.
        </li>
        <li className="flex items-center">
          <span className="mr-3 text-primary">3.</span> You get a tactical scouting report instantly.
        </li>
      </ul>

      <Button
        ref={buttonRef}
        size="lg"
        onClick={handleStart}
        className="text-lg px-8 py-6 rounded-full transition-shadow hover:shadow-lg hover:shadow-primary/25"
      >
        Start Scouting
      </Button>
    </section>
  );
}
