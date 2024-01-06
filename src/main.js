//@ ts-check

const { execSync, spawn } = require("child_process");
const { readFileSync, copyFile } = require("fs");
const { exit } = require("process");

const config = require("../config/app.json");

function update() {
  console.log("Updating from git...");
  try {
    let result = execSync("git pull");
    console.log(`${result}`);
  } catch (err) {
    console.error(
      "Unable to sync from remote git repository. Proceeding anyway."
    );
  }
}

function spawnBot(iteration = 1, crashcount = 0, startTime = Date.now()) {
  update();

  console.log(
    `Executing instance ${iteration} @ ${new Date().toLocaleString()}...`
  );

  let bot = spawn("node", ["./src/bot.js"], { cwd: "." });

  bot.stdout.on("data", (data) => {
    console.log(`Log: #${iteration} @ ${new Date().toLocaleString()}: ${data}`);
  });

  bot.stderr.on("data", (data) => {
    console.log(
      `Error: #${iteration} @ ${new Date().toLocaleString()}: ${data}`
    );
  });

  bot.on("exit", (code) => {
    if (code === 0) {
      console.log("Updating and rebooting instance...");
      setTimeout(() => spawnBot(iteration + 1, 0, Date.now()), 500);
    } else {
      console.error(
        `Instance #${iteration} crash @ ${new Date().toLocaleString()}\n`
      );

      if (crashcount >= config["max-crash"]) {
        console.error(
          `Maximum of ${config["max-crash"]} crashes has been reached, aborting...`
        );
        exit(1);
      } else {
        setTimeout(
          () =>
            spawnBot(
              iteration + 1,
              startTime - Date.now() < config["minimum-alive"]
                ? crashcount + 1
                : 0,
              Date.now()
            ),
          500
        );
      }
    }
  });
}

function init() {
  let botConf1ig;

  try {
    botConfig = readFileSync("./config/bot.json");
  } catch {
    console.log(
      `No client configuration detected.
Please create one from the provided template in <ROOT>/config/.`
    );
    copyFile("./config/bot.json.template", "./config.bot.json");

    exit(1);
  }

  spawnBot();
}

init();
