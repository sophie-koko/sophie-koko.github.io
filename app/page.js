import Link from "next/link";

export default function Home() {
  return (
    <main className="home-main page-container">
      <h1 className="home-title">Welcome to Sophie's Website!</h1>
      <div className="home-body">
        <p>
          Hi! I&apos;m Sophie, and I love Stitch from Disney. 🦋
          I also love beating math problems in <Link href="/tetrix">Tetrix</Link> — can you beat my score?
        </p>
        <p style={{ marginTop: '12px' }}>My favorite Stitch movies:</p>
        <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '2.1' }}>
          <li><a href="https://movies.disney.com/lilo-and-stitch-2025" target="_blank" rel="noopener noreferrer">Lilo &amp; Stitch (2025)</a></li>
          <li><a href="https://movies.disney.com/lilo-stitch-2-stitch-has-a-glitch" target="_blank" rel="noopener noreferrer">Lilo &amp; Stitch 2: Stitch Has a Glitch</a></li>
          <li><a href="https://movies.disney.com/leroy-and-stitch" target="_blank" rel="noopener noreferrer">Leroy &amp; Stitch</a></li>
          <li><a href="https://movies.disney.com/lilo-stitch" target="_blank" rel="noopener noreferrer">Lilo &amp; Stitch (2002)</a></li>
          <li><a href="https://movies.disney.com/lilo-and-stitchs-island-of-adventures" target="_blank" rel="noopener noreferrer">Lilo &amp; Stitch&apos;s Island of Adventures</a></li>
        </ul>
      </div>
    </main>
  );
}
