import TetrixGame from './TetrixGame';

export const metadata = {
  title: "Tetrix — Sophie's Website",
  description: "Beat the Matrix by solving falling math problems",
};

export default function TetrixPage() {
  return (
    <main style={{ background: '#050505', padding: '20px 16px 40px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto 16px', paddingLeft: '4px' }}>
        <a
          href="/"
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.9rem',
            color: '#00aa44',
            textDecoration: 'none',
            fontWeight: '600',
          }}
        >
          ← Sophie&apos;s Website
        </a>
      </div>
      <TetrixGame />
      <p style={{
        fontFamily: 'Courier New, monospace',
        fontSize: '0.68rem',
        color: '#004d1a',
        textAlign: 'center',
        maxWidth: '720px',
        margin: '14px auto 0',
        lineHeight: '1.7',
      }}>
        Matrix digital rain inspired by <em>The Matrix</em> (1999) &mdash; &copy; Warner Bros. Entertainment Inc. All rights reserved.
        &nbsp;&nbsp;·&nbsp;&nbsp;
        Tetrix inspired by Tetris&reg; &mdash; Tetris&reg; is a registered trademark of The Tetris Company, LLC.
        &nbsp;&nbsp;·&nbsp;&nbsp;
        Original Tetris game created by Alexey Pajitnov (1984).
      </p>
    </main>
  );
}
