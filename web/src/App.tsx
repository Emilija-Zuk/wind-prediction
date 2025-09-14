import React, { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
  Outlet,
  useLocation,
} from "react-router-dom";
import "./App.css";

import Navigation from "./components/Navigation/Navigation";
import Home from "./pages/Home/Home";
import Predictions from "./pages/Predictions/Predictions";
import HistoricalData from "./pages/HistoricalData/HistoricalData";
import About from "./pages/About/About";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);     
      document.body.style.overflow = "hidden";  // lock scrolling
      void document.body.offsetHeight;          // force reflow to flush queue
      document.body.style.overflow = "";        // unlock scrolling
    };

    scrollToTop();
    
  }, [pathname]);

  return null;
};

const Layout = () => {
  return (
    <div className="app-container">
      <div className="main-container">
        <Navigation />
        <ScrollToTop />
        <Outlet />
      </div>
    </div>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="predictions" element={<Predictions />} />
      <Route path="historical-data" element={<HistoricalData />} />
      <Route path="about" element={<About />} />
    </Route>
  )
);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
