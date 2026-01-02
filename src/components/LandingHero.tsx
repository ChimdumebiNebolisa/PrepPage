"use client";

export default function LandingHero({ onStartScouting }: { onStartScouting: () => void }) {
  return (
    <section className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 bg-gradient-to-b from-background to-muted/50">
      <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
        Prep Page
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
        Know your opponent in 30 seconds.
      </p>

      <ul className="text-left space-y-3 mb-12 text-lg text-muted-foreground">
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

      <button
        onClick={onStartScouting}
        className="text-lg px-8 py-6 rounded-full bg-primary text-primary-foreground font-medium transition-shadow hover:shadow-lg hover:shadow-primary/25 active:scale-95"
      >
        Start Scouting
      </button>
    </section>
  );
}
