import React, { useState, useEffect } from 'react';
import './Hero.css';

import Home4 from '../assets/Home4.png'

const Hero = () => {
  const [typedText, setTypedText] = useState('');
  const fullHeadline = "Build Smarter Bots in Minutes.";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullHeadline.slice(0, i));
      i++;
      if (i > fullHeadline.length) clearInterval(interval);
    }, 70);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section">
      <div className="bg-glow"></div>
      <div className="neural-grid"></div>

      <div className="hero-container">
        <div className="hero-text">
          <div className="badge"> AI-Powered No-Code Builder</div>
          <h1>
            {typedText}
            <span className="cursor">|</span>
          </h1>
          <p>
            Build Complex AI Agents in Minutes, Not Months.
            The No-Code Engine for High-Performance Industry AI. Build chatbots for your businesses and webistes in minutes without any coding 
          </p>
          <div className="hero-btns">
            <button className="btn-main">Get Started Free</button>
            <button className="btn-glass">View Templates</button>
          </div>
        </div>

        {/* RIGHT SIDE: Updated with your Image */}
       
          <div className="image-wrapper">
             <img src={Home4} alt="Home Dashboard" className="home-image" />
             {/* Optional: Add a subtle glow behind the image */}
             <div className="image-glow"></div>
          </div>
        </div>
    
    </section>
  );
};

export default Hero;
