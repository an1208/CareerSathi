import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  const callAPI = async () => {
    const res = await fetch("http://localhost:3001/");
    const data = await res.text();
    setMessage(data);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>CareerSathi</h1>
      <button onClick={callAPI}>Ping Backend</button>
      <p>{message}</p>
    </div>
  );
}

export default App;
