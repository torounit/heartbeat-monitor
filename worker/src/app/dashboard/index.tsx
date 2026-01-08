import honoFactory, { authMiddleware } from "../../services/honoFactory";

const app = honoFactory
  .createApp()
  .use("*", authMiddleware)
  .get("/", (c) => {
    return c.render(<div id="root" />);
  });

export default app;
