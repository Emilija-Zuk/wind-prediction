import './App.css';

function App() {
  return (
    <div className="App">
      
      <header className="card">

          <div className="logo">

                <img src="/images/logo.png" alt="Em" className="logo-image" />
          </div>
        

        <div className="main-content">
         
          <h1 className="main-title">Wind Prediction</h1>
          <h2 className="subtitle">Forecasting the winds ahead</h2>
          
          <div className="description-content">

            <div >
              <p>
              This app was designed for Gold Coast Seaway wind prediction, but it can be extended for any station. 
              It’s a handy tool for kite surfers, surfers and sailors. 
              It uses AI and machine learning to crunch past weather data and live updates
          
              </p>
            </div>
            <div className='background'>
                <div className='description2'>
                  <p>
                  Do you live miles from your favourite kite spot? The weather forecast looks sweet — but will the wind actually stick around for the next few hours?
                  Is it even worth the drive?
                  Wind Prediction helps you make the call! Just check this and get out on the water yeew!
                 
                  </p>
                </div>
                

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
      

                <div className="button-section">
              <button className="button primary">Explore Predictions</button>
              <button className="button secondary">View Historical Data</button>
            </div>

            </div>
           <div className='ems-apps'>
              <p>
                  Designed by Emilija, a software developer with a passion for water sports
              </p>
                <img src="/images/me.jpg" alt="Em" className="ems-image" />
            </div>
            

          </div>
        </div>
        
       
      </header>
    </div>
  );
}

export default App;
