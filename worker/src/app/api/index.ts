import honoFactory from "../../services/honoFactory";
import heartbeat from "./heartbeat";
import devices from "./devices";
import reports from "./reports";
import status from "./status";

const api = honoFactory
  .createApp()
  .route("/devices", devices)
  .route("/reports", reports)
  .route("/status", status)
  .route("/heartbeat", heartbeat);

export default api;
