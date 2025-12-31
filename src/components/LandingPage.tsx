import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Simple "Marquee" component
const TickerTape = () => {
  return (
    <div style={{
      width: '100%',
      background: '#000',
      borderTop: '2px solid #222',
      borderBottom: '2px solid #222',
      padding: '12px 0',
      overflow: 'hidden',
      position: 'relative',
      whiteSpace: 'nowrap'
    }}>
      <div className="ticker-move" style={{
        display: 'inline-block',
        color: '#00ff41',
        fontFamily: "'Courier New', monospace",
        fontWeight: 'bold',
        fontSize: '18px',
        animation: 'marquee 20s linear infinite'
      }}>
        BTC $97,420 ▲ &nbsp;&nbsp;&nbsp; ETH $3,850 ▲ &nbsp;&nbsp;&nbsp; SPX 5,200 ▲ &nbsp;&nbsp;&nbsp; TSLA $340 ▼ &nbsp;&nbsp;&nbsp; AAPL $185 ▲ &nbsp;&nbsp;&nbsp; NYK 102 - BOS 98 &nbsp;&nbsp;&nbsp;
        BTC $97,420 ▲ &nbsp;&nbsp;&nbsp; ETH $3,850 ▲ &nbsp;&nbsp;&nbsp; SPX 5,200 ▲ &nbsp;&nbsp;&nbsp; TSLA $340 ▼ &nbsp;&nbsp;&nbsp; AAPL $185 ▲ &nbsp;&nbsp;&nbsp; NYK 102 - BOS 98 &nbsp;&nbsp;&nbsp;
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
  const navigate = useNavigate(); 
  const [hover, setHover] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- Auth Check ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // --- Image Rotation Logic ---
  const heroImages = ['/hero1.jpg', '/hero2.jpg']; 
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 4000); 
    return () => clearInterval(interval); 
  }, []);

  // --- Main Button Logic ---
  const handleMainAction = () => {
      if (isAuthenticated) {
          // EXISTING USER: Go directly to Devices page
          navigate("/devices");
      } else {
          // NEW CUSTOMER: Go to shop/products
          navigate("/products"); 
      }
  };

  const handleLogout = () => {
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      window.location.reload(); 
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #0a0a0a, #111)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* 1. Header / Nav */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>
          TICKER<span style={{ color: '#00ff41' }}>.INK</span>
        </div>
        
        {/* Top Right: Always Login/Logout */}
        {isAuthenticated ? (
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                color: '#888',
                padding: '8px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}>
              Log Out
            </button>
        ) : (
            <button 
              onClick={onLoginClick}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                color: '#fff',
                padding: '8px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600'
              }}>
              Log In
            </button>
        )}
      </nav>

      {/* 2. Hero Section */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 20px'
      }}>
        
        <h1 style={{ 
          fontSize: 'clamp(40px, 6vw, 80px)', 
          fontWeight: '900', 
          lineHeight: '1.1', 
          marginBottom: '20px',
          background: 'linear-gradient(180deg, #fff 0%, #888 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Wall Street to Gameday.
        </h1>

        <p style={{ 
          fontSize: '20px', 
          color: '#888', 
          maxWidth: '600px', 
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          The ultimate real-time display for stocks, crypto, and live sports. 
          Upgrade your space with data that moves as fast as you do.
        </p>

        {/* 3. The "Action" Button */}
        <button 
          onClick={handleMainAction}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            background: hover ? '#00cc33' : '#00ff41',
            color: '#000',
            padding: '16px 40px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '50px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: hover ? '0 0 30px rgba(0, 255, 65, 0.4)' : '0 0 10px rgba(0, 255, 65, 0.1)',
            transform: hover ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {isAuthenticated ? "Manage My Device →" : "Shop Ticker →"}
        </button>

        {/* 4. Product Image Section */}
        <div style={{ 
          marginTop: '60px', 
          width: '100%', 
          maxWidth: '800px', 
          height: '400px', 
          background: 'radial-gradient(circle at center, #222 0%, #000 70%)',
          borderRadius: '12px',
          border: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <img 
            src={heroImages[currentImageIndex]} 
            alt="Ticker Device"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              zIndex: 10,
              position: 'relative',
              transition: 'opacity 0.5s ease-in-out'
            }} 
          />
          
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%',
            height: '20%',
            background: '#00ff41',
            filter: 'blur(100px)',
            opacity: 0.2,
            zIndex: 0
          }}></div>
        </div>

      </main>

      {/* 5. Footer Ticker */}
      <footer style={{ marginTop: 'auto', paddingBottom: '0' }}>
        <p style={{ textAlign: 'center', color: '#444', fontSize: '12px', marginBottom: '10px' }}>
          LIVE DATA STREAM
        </p>
        <TickerTape />
      </footer>
    </div>
  );
}