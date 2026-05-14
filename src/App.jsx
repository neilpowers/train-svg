import React from "react";
import CarriageSVG from "./components/CarriageSVG";
import data from "./data/class800_carriage.json";
import useMediaQuery from "./hooks/useMediaQuery";

function App() {
  const isLandscape = useMediaQuery("(min-width: 1024px)");

  return (
    <div style={{ padding: "20px" }}>
      <h2>LNER Carriage A</h2>
      <CarriageSVG data={data} landscape={isLandscape} />
    </div>
  );
}

export default App;
