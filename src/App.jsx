import React from "react";
import CarriageSVG from "./components/CarriageSVG";
import data from "./data/class800_carriage.json";
//import data from "./data/7631_AB_WC_P_COACH_J_1ST_W.json"
import useMediaQuery from "./hooks/useMediaQuery";

function App() {
  const isLandscape = useMediaQuery("(min-width: 1024px)");

  return (
    <div style={{ padding: "20px" }}>
      <h2>{data.meta.rollingStock}</h2>
      <CarriageSVG data={data} landscape={isLandscape} />
    </div>
  );
}

export default App;
