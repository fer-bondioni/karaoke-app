export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎤 Karaoke Night
        </h1>
        <p className="text-xl text-muted-foreground">
          Sing together, challenge friends, and have fun!
        </p>
        <div className="text-sm text-muted-foreground">
          Setting up your karaoke experience...
        </div>
      </div>
    </main>
  );
}
