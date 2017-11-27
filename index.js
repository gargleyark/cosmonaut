var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var thrivingSystems = []
var map = generateMap()
run()

app.get('/', function (req, res) {
  app.use(express.static(__dirname + '/public'))
  res.sendFile(__dirname + '/public/index.html')
})

io.on('connection', function (socket) {
  io.emit('worldUpdate', map)
  socket.on('disconnect', function () {
    console.log('user disconnected')
  })
  socket.on('playerMove', function (data) {
    console.log('player moved', data)
    io.emit('playerMove', JSON.stringify(data))
  })
  socket.on('chat message', function (msg) {
    io.emit('chat message', msg)
  })
})

http.listen(3000, function () {
  console.log('started')
})


function run () {
  setInterval(() => {
    for (let system of thrivingSystems) {
      let tile = map[system[0]][system[1]]
      tile.system.population = parseInt(tile.system.population * Math.random()) + 21600345
    }
    io.emit('worldUpdate', map)
  }, 10000)
}

function generateMap () {
  let map = []
  for (let i = 0; i < 10; i++) {
    let row = []
    for (let ii = 0; ii < 10; ii++) {
      row.push(getSquare(i, ii))
    }
    map.push(row)
  }
  return map
}

function getSquare (x, y) {
  let system
  if (Math.random() < 0.2) {
    system = getSystem(x, y)
  }
  return new Tile({
    system
  })
}

function getSystem (x, y) {
  let type = parseInt(Math.random() * 5) - 2
  type = type > 0 ? type : 0
  let population = 0
  if (type === 2) {
    thrivingSystems.push([x, y])
    population = parseInt(Math.random() * 10000000) + 10000000
  }
  return {
    name: getSystemName(),
    population,
    planets: getPlanets(type),
    type,
    top: Math.random(),
    left: Math.random(),
    faction: 0
  }
}

function getPlanets (type) {
  let planets = []
  for (let i = 0; i < ((Math.random() * 5) + 2); i++) {
    planets.push(getPlanet(type))
  }
  planets[0].type = type
  return planets
}

function getPlanet (type) {
  const name = getPlanetName()
  const minerals = getMinerals(parseInt((Math.random() * 5) + (Math.random() * 5) - (Math.random() * 5))) || getMinerals(0)
  type = parseInt(Math.random() * (type + 0.5))
  return new Planet ({
    name,
    type,
    minerals
  })
}

function getMinerals (index) {
  return [
    {
      name: 'stone',
      value: 1
    },
    {
      name: 'iron',
      value: 2
    },
    {
      name: 'carbon',
      value: 2
    },
    {
      name: 'silver',
      value: 4
    },
    {
      name: 'gold',
      value: 10
    },
    {
      name: 'platinum',
      value: 24
    },
    {
      name: 'caesium',
      value: 18
    },
    {
      name: 'uranium',
      value: 32
    },
    {
      name: 'protonium',
      value: 26
    },
    {
      name: 'argon',
      value: 70
    }
  ][index]
}

function getPlanetName () {
  const namePart = ['ar', 'gon', 'glo', 'tar', 'ur', 'ura', 'vera', 'sato', 'ver', 'var', 'bus', 'rea', 'ae', 'can', 'nex', 'drak', 'can', 'wa', 'mar', 'dun', 'rit', 'sar', 'sen', 'sun', 'tor', 'at', 'len', 'dis', 'a', 'or', 'des', 'kra', 'pon', 'pin', 'i', 'o', 'to', 'so', 'ko', 'pi']
  return namePart[parseInt(Math.random() * (namePart.length - 1))] + namePart[parseInt(Math.random() * (namePart.length - 1))] + (namePart[parseInt(Math.random() * (namePart.length * 2))] || '')
}

function getSystemName () {
  const namePart = ['ar', 'gon', 'glo', 'tar', 'stole', 'red', 'grey', 'grave', 'doom', 'dark', 'rock', 'old', 'star', 'high', 'white', 'black', 'can', 'usur', 'mar', 'dun', 'erit', 'tres', 'sen', 'sun', 'atmos', 'at', 'len', 'dis', 'era', 'bran', 'des', 'kra', 'pon', 'pin', 'war', 'cold', 'lost', 'well', 'see', 'go']
  return namePart[parseInt(Math.random() * (namePart.length - 1))] + namePart[parseInt(Math.random() * (namePart.length - 1))] + '-' + parseInt((Math.random() * 9000) + 999)
}

function Tile (options) {
  this.system = options.system || false
  this.tradingPost = options.system && options.system.type && Math.random() < 0.3 || false
  this.pirates = false
}

function Planet (options) {
  this.name = options.name
  this.type = options.type
  this.population = options.population
  this.minerals = options.minerals
}
