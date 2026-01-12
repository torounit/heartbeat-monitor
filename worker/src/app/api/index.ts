import honoFactory from "../../services/honoFactory";
import heartbeat from "./heartbeat";
import locations from "./locations";
import reports from "./reports";
import status from "./status";

const api = honoFactory
  .createApp()
  .route("/locations", locations)
  .route("/reports", reports)
  .route("/status", status)
  .route("/heartbeat", heartbeat);

export default api;
