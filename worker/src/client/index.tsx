import { render } from "hono/jsx/dom";
import Dashboard from "./Dashboard";

function App() {
  return <Dashboard />;
}

const root = document.getElementById("root");
if (root) {
  render(<App />, root);
}
