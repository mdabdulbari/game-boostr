import _ from "lodash"
import R from "ramda"
import Promise from "bluebird"

import migrate from "./migrate"
import SteamAccount from "./steamaccount"
import * as manageDB from "./database"

migrate()
const database = manageDB.read()

import telebotStart from "./telebot"
telebotStart()

if (database.length === 0) {
  console.error(
    "[!] No accounts have been added! Please run 'npm run user' to add accounts!"
  )
  process.exit(0)
}

const pad = 24 + _.maxBy(R.pluck("name", database), "length").length
const accounts = _.compact(
  database.map(({ name, password, sentry, secret, games = [] }) => {
    if (games.length > 0) return new SteamAccount(name, password, sentry, secret, games, pad)

    return null
  })
)

const restartBoost = () => {
  console.log("[=] Restart boosting")
  return Promise.map(accounts, _.method("restartGames"))
    .delay(1800000)
    .finally(restartBoost)
}

console.log("[=] Start boosting")
Promise.map(accounts, _.method("boost"))
  .delay(1800000)
  .then(restartBoost)
