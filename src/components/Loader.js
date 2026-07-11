export default function Loader() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0f1115', // Dark background matching the theme
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999,
    }}>
      <div style={{
        position: 'relative',
        width: '80px',
        height: '80px',
        marginBottom: '20px'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '4px solid rgba(220, 163, 60, 0.2)', // Faded gold
          borderTop: '4px solid #dca33c', // Bright gold
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <img 
          src="/logo.jpg" 
          alt="HMHPro Logo" 
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      </div>
      <h2 style={{
        color: '#dca33c',
        fontFamily: 'var(--font-manrope), sans-serif',
        fontSize: '1.2rem',
        fontWeight: '600',
        letterSpacing: '1px',
        margin: 0
      }}>
        Loading HMHPro...
      </h2>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
