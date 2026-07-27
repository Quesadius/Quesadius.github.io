import { existsSync, writeFileSync } from "node:fs";

// highpoints.html fetches dummy_climb_data.csv when served from localhost.
// The file is gitignored (dummy*), so CI checkouts don't have it — create a
// minimal stand-in. Never overwrites a real local copy.
export default function globalSetup() {
  if (!existsSync("dummy_climb_data.csv")) {
    writeFileSync(
      "dummy_climb_data.csv",
      "State,Date,Miles Hiked,Elevation Gained\n" +
        "California,2023-08-12,22,6100\n" +
        "Colorado,2022-07-04,9.5,4700\n",
    );
  }
}
