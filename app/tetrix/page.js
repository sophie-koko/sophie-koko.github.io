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
    </main>
  );
}
