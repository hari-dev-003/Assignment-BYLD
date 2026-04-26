import "dotenv/config";
import app from "./app.js";
import { startAlertPoller } from "./jobs/alertPoller.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
  startAlertPoller();
});
