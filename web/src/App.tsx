import React from 'react';
import './App.css';

const App: React.FC = () => {
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
                This predicts wind at{' '}
                <b>
                   Gold Coast Seaway. 
                </b>
                 {' '} Perfect for kite surfers, surfers and sailors.
                </p>
            </div>
            <div className='background'>
                <div className='description2'>
                  <p>
                  Do you live far from your favourite kite spot? 
               
                  The wind is ON! But will it stick around for the next few hours?
                  Is it worth the drive??
                  <br />
                  <br />
                  Check here first, then get out on the water. Yeew!
                 
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
