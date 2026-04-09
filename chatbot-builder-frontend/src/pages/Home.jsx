import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Feautures'
import Footer from '../components/Footer'
const Home = () => {
  return (
     <>
      <Navbar />
        <Hero />
        <Features/>
        <Footer/>
     </>
  )
}

export default Home