//@ts-check

const { exec, execSync } = require("child_process");
const { readFileSync } = require("fs");
const { exit } = require("process");

const { connect } = require("./bot.js");
const config = require("../config/bot.json");

function update() {
  console.log("Updating from git...");
  let result = execSync("git pull");
  console.log(`${result}`);
}

/**
 *
 * @param {Number} iteration
 * @param {Number} lastCrash
 */
function main(iteration, lastCrash) {
  console.log(`Attempt #${iteration} at ${new Date().toLocaleString()}...`);

  try {
    connect();
  } catch (err) {
    console.log("Client Crash:");
    console.error(err);

    if (lastCrash - Date.now() < config["minimum-alive"]) {
      if (iteration >= config["max-crash"]) {
        console.log("Max crashes reached within minimum succession, aborting.");
      } else {
        setTimeout(() => main(iteration + 1, Date.now()), 3000);
        return;
      }
    } else {
      main(1, Date.now());
      return;
    }
  }

  console.log("Updating and rebooting bot...");
  setTimeout(() => init(), 5000);
}

function init() {
  update();

  let config;

  try {
    config = readFileSync("./config/app.json");
  } catch {
    console.log(
      `No configuration detected.
Please create one from the provided template in <ROOT>/config/.`
    );

    exit(0);
  }

  main(1, Date.now());
}

init();
