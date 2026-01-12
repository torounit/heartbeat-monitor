import honoFactory from "../../services/honoFactory";
import devices from "./devices";
import heartbeat from "./heartbeat";
import reports from "./reports";
import status from "./status";

const api = honoFactory
  .createApp()
  .route("/devices", devices)
  .route("/reports", reports)
  .route("/status", status)
  .route("/heartbeat", heartbeat);

export default api;
