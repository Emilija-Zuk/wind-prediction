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
    window.scrollTo(0, 0);
    const focusElement = document.createElement("button");
    focusElement.style.position = "absolute";
    focusElement.style.top = "-10px";
    focusElement.style.left = "0";
    focusElement.style.width = "1px";
    focusElement.style.height = "1px";
    focusElement.style.opacity = "0";
    focusElement.style.pointerEvents = "none";
    focusElement.setAttribute("aria-hidden", "true");

    document.body.insertBefore(focusElement, document.body.firstChild);
    focusElement.focus();

    // Clean up immediately
    setTimeout(() => {
      if (document.body.contains(focusElement)) {
        document.body.removeChild(focusElement);
      }
    }, 50);
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
