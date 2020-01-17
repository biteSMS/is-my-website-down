require("dotenv").config();
const axios = require("axios");
const moment = require("moment");
const { Toolkit } = require("actions-toolkit");
const { GistBox } = require("gist-box");

Toolkit.run(
  async tools => {
    const { GIST_ID, GH_USERNAME, GH_PAT } = process.env;

    // Get the user's public events
    tools.log.debug(`Getting activity for ${GH_USERNAME}`);

    let websites = [
      {
        name: "pannnda",
        url: "https://www.pannnda.com"
      },
      {
        name: "blog",
        url: "https://blog.pannnda.com"
      },
      {
        name: "jwzx",
        url: "https://jwzx.pannnda.com"
      }
    ];
    let status = [];

    const fetchSite = website =>
      new Promise(async resolved => {
        let closed = true;
        let res = await axios.get(website.url);
        if (res.status === 200) {
          closed = false;
        }
        status.push({
          name: website.name,
          closed
        });
        resolved();
      });

    //await Promise.all(websites.map(s => fetchSite(s)));
    for (let i = 0; i < websites.length; i++) {
      await fetchSite(websites[i])
    }

    const time = moment().format("YYYY-MM-DD kk:mm ZZ");

    let content = status
      .map(s => `${s.name}: ${s.closed ? "closed." : "running..."}\n`)
      .join("")
      .concat(`\n${time}`);

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
