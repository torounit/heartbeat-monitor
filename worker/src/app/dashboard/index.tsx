import honoFactory from "../../services/honoFactory";

const app = honoFactory.createApp().get("/", (c) => {
  return c.render(<div id="root" />);
});

export default app;
