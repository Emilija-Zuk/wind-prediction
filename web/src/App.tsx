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
    // Chrome mobile specific fix
    const isChromeMobile =
      /Chrome/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent);

    if (isChromeMobile) {
      // Method 1: Force address bar to collapse first
      window.scrollTo(0, 1);

      // Method 2: Then scroll to actual top after address bar is hidden
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);

      // Method 3: Force viewport recalculation
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
        window.scrollTo(0, 0);
      }, 200);
    } else {
      // For all other browsers
      window.scrollTo(0, 0);
    }
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
