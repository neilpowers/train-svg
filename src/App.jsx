
import React from "react";

import CarriageSVG from "./components/CarriageSVG";
import data from "./data/class800_carriage.json";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>LNER Carriage A</h2>
      <CarriageSVG data={data} />
    </div>
  );
}

export default App;