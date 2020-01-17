require("dotenv").config();
const axios = require("axios");
const moment = require("moment");
const { Toolkit } = require("actions-toolkit");
const { GistBox } = require("gist-box");
const websites = require("./websites");

Toolkit.run(
  async tools => {
    const { GIST_ID, GH_USERNAME, GH_PAT } = process.env;

    // Get the user's public events
    tools.log.debug(`Getting activity for ${GH_USERNAME}`);

    const fetchSite = website =>
      new Promise(async resolved => {
        let closed = true;
        tools.log.debug(`Fetching ${website.url}`);
        let res = await axios.get(website.url);
        tools.log.debug(`${website.name} finished.`);
        if (res.status === 200) {
          closed = false;
        }
        websites.find(s => s === website).closed = closed;
        resolved();
      });

    tools.log.debug(`Starting fetchSite...`);
    await Promise.all(websites.map(s => fetchSite(s)));

    const time = moment()
      .utcOffset(480)
      .format("YYYY-MM-DD kk:mm ZZ");

    let content = websites
      .map(s => `${s.name}\t${s.closed ? "🔴closed." : "🟢running..."}\n`)
      .join("")
      .concat(`${time}`);

    const box = new GistBox({ id: GIST_ID, token: GH_PAT });
    try {
      tools.log.debug(`Updating Gist ${GIST_ID}`);
      await box.update({ content });
      tools.exit.success("Gist updated!");
    } catch (err) {
      tools.log.debug("Error getting or update the Gist:");
      return tools.exit.failure(err);
    }
  },
  {
    event: ["schedule", "push"],
    secrets: ["GH_PAT", "GH_USERNAME", "GIST_ID"]
  }
);
