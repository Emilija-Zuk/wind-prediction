import './App.css';

function App() {
  return (
    <div className="App">
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="main-title">Wind Prediction</h1>
          <h2 className="subtitle">Forecasting the winds ahead</h2>
          
          <div className="description">
            <p>
              Harness the power of artificial intelligence and machine learning to predict wind patterns 
              with unprecedented accuracy. My advanced forecasting system combines historical weather data, 
              real-time conditions, and ML algorithms to deliver reliable wind predictions.
            </p>
            
            <div className="features-grid">
              <div className="feature-card">
                <h3>AI-Powered</h3>
                <p>Machine learning models trained on real meteorological datasets</p>
              </div>
              
              <div className="feature-card">
                <h3>Real-time Data</h3>
                <p>Live wind speed and direction monitoring with instant updates</p>
              </div>
              
              <div className="feature-card">
                <h3>Accurate Forecasts</h3>
                <p>Precise wind predictions for a desired location</p>
              </div>
              
              <div className="feature-card">
                <h3>Modern Interface</h3>
                <p>Clean, responsive design built with modern React architecture</p>
              </div>
            </div>
            
            <div className="cta-section">
              <button className="cta-button primary">Explore Predictions</button>
              <button className="cta-button secondary">View Historical Data</button>
            </div>
          </div>
        </div>
        
        <div className="wind-animation">
          <div className="wind-lines">
            <div className="wind-line"></div>
            <div className="wind-line"></div>
            <div className="wind-line"></div>
            <div className="wind-line"></div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
