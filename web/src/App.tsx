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
import SocialLinks from "./components/SocialLinks/SocialLinks";
import Home from "./pages/Home/Home";
import Predictions from "./pages/Predictions/Predictions";
import Analysis from "./pages/Analysis/Analysis";
import About from "./pages/About/About";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
      window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Layout = () => {
  const { pathname } = useLocation();
  
  return (
    <div className="app-container">
      <div className="main-container" >
        <Navigation />
        {/* <SocialLinks /> */}
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
      <Route path="analysis-data" element={<Analysis />} />
      <Route path="about" element={<About />} />
    </Route>
  )
);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
