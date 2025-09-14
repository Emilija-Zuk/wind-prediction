import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
  ScrollRestoration,
  Outlet,
} from "react-router-dom";
import "./App.css";

import Navigation from "./components/Navigation/Navigation";
import Home from "./pages/Home/Home";
import Predictions from "./pages/Predictions/Predictions";
import HistoricalData from "./pages/HistoricalData/HistoricalData";
import About from "./pages/About/About";


const Layout = () => {
  return (
    <div className="app-container">
      <div className="main-container">
        <Navigation />
        <Outlet />
        <ScrollRestoration getKey={(location) => location.pathname} />
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
