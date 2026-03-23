
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
// import FeatureGrid from "./components/FeatureGrid";
// import TelemetryDashboard from "./components/TelemetryDashboard";
// import CompareDrivers from "./components/CompareDrivers";
import Features from "./components/Features";
import EditorialSplit from "./components/EditorialSplit";
import Footer from "./components/Footer";
import DriversPage from "./components/DriversPage";
import RaceArchivePage from "./components/RaceArchivePage";
import RaceDetailPage from "./components/RaceDetailPage";
import RacePredictionPage from "./components/RacePredictionPage";

function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <EditorialSplit />
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/races" element={<RaceArchivePage />} />
        <Route path="/races/:raceId" element={<RaceDetailPage />} />
        <Route path="/races/:raceId/predict" element={<RacePredictionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
