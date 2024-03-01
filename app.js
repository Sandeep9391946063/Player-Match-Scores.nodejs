const express = require('express')
const path = require('path')
const {open} = require('sqlite')

const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dpPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dpPath,
      driver: sqlite3.Database,
    })
    app.listen(3001, () => {
      console.log('Server Running at http://localhost:3001/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const convertPlayerDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatchDbObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

app.get('/player', async (request, response) => {
  const {playerId} = request.params

  const GetPlayerQuery = `
    SELECT *
    FROM
    players_details;
    `
  const playerArray = await db.all(GetPlayerQuery)
  response.send(
    playerArray.map(eachPlayer =>
      convertPlayerDbObjectToResponseObject(eachPlayer),
    ),
  )
})

app.get('players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const GetPlayerQuery = `
     SELECT *
    FROM
    players_details
    WHERE 
      player_id = ${playerId};`
  const player = await db.get(GetPlayerQuery)
  response.send(convertPlayerDbObjectToResponseObject(player))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body

  const updateQuery = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE
    player_id = ${playerId};`
  await db.run(updateQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params

  const GetPlayerQuery = `
        SELECT *
        FROM
        match_details
        WHERE
        match_id = ${matchId};`
  const matchDetials = await db.get(GetPlayerQuery)
  response.send(convertMatchDbObjectToResponseObject(matchDetials))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const GetPlayerMatchesQuery = `
        SELECT * 
        FROM
        player_match_score 
        NATURAL JOIN match_details
        WHERE
        player_id = ${playerId};
    `
  const playerMatches = await db.all(GetPlayerMatchesQuery)
  response.send(
    playerMatches.map(eachMatch =>
      convertMatchDbObjectToResponseObject(eachMatch),
    ),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const GetPlayerMatchesQuery = `
     SELECT * 
        FROM
        player_match_score 
        NATURAL JOIN player_details
        WHERE
        match_id = ${matchId};`
  const playersArray = await db.all(GetPlayerMatchesQuery)
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayerDbObjectToResponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params

  const GetPlayerMatchesQuery = `
  SELECT 
  player_id as playerId,
  player_name as playerName,
  total_score as totalScore,
  total_fours as totalFours,
  total_sixes as totalSixes
  
  FROM player_match_score
  NATURAL JOIN player_details

  WHERE 
    player_id = ${playerId};`

  const playerMatcheDetails = await db.get(GetPlayerMatchesQuery)
  response.send(playerMatcheDetails)
})

module.exports = app
