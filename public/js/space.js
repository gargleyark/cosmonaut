const $ = window.jQuery
const width = document.body.clientWidth
const height = document.body.clientHeight
let player
let $world

function init (data) {
  window.map = data
  player = getPlayer()
  $world = createWorld()
  render()
  setUpMultiplayer()
}

function createWorld () {
  const top = (height - 6000) / 2
  const left = (width - 6000) / 2
  return $(`<div class="world" style="top: ${top}px; left: ${left}px"/>`)
    .appendTo('body')
}

function render () {
  // const width = 10
  const x = player.tile[0]
  const y = player.tile[1]
  for (let i = -5; i < 5; i++) {
    let row = []
    for (let ii = -5; ii < 5; ii++) {
      let $div = $(`<div class="tile left-${ii} top-${i}" data-left="${ii}" data-top="${i}"/>`)
        .append(getSystemImage(map[x + ii][y + i]))
        .appendTo($world)
      $div.append('<div>' + getSystemPanel(map[x + ii][y + i]) + '</div>')
      $div.find('img').hover(() => {
        $div.toggleClass('show')
        $div.find('div').html(getSystemPanel(map[x + ii][y + i]))
      })
      row.push($div)
    }
  }
  addEvents(
    createShip(player.ship.id, (width / 2) - 15, (height / 2) - 15).appendTo($world)
  )
  $world.append(getUI())
}

function addEvents ($ship) {
  setUpMovement()
  setUpQuickLookUI($ship)
  setUpRotation($ship)
  startNeutralAI()
}

function setUpMultiplayer () {
  socket.on('playerMove', (data) => {
    console.log('data is ' + data)
    data = JSON.parse(data)
    if (data && player.id !== data.player.id) {
      console.log('ship move registered for', data.id)
      if (!$('.ship-multiplayer.' + data.id).length) {
        createShip(data.ship, data.x, data.y, data.player)
          .appendTo($world)
        console.log('ship created for', data.id)
      } else {
        $('.ship-multiplayer.' + data.id).stop(true, false).animate({
          left: data.x,
          top: data.y
        })
      }
    }
  })
}

function createShip (ship, x, y, player) {
  console.log(`<div class="ship${player && ' ship-multiplayer' || ''} id-${ship} ${player && player.id || ''}" />`)
  let $ship = $(`<div class="ship${player && ' ship-multiplayer' || ''} id-${ship} ${player && player.id || ''}"><div class="name">${player && player.name || ''}</div></div>`).css({
    left: x,
    top: y
  })

  return $ship
}

function setUpQuickLookUI ($ship) {
  const $ui = $('<div class="quicklook" />')
  $ship.hover(() => {
    const healthPercent = (100 / player.ship.maxHealth) * player.ship.health
    $ui.html(`
      <p><span class="healthbar"><span class="health" style="width: ${healthPercent}%;"> </span></span></p>
    `).appendTo($world)
  },
  () => {
    $ui.remove()
  })
}

function startNeutralAI () {
  let oldHor
  let oldVer
  let newHor
  let newVer

  setInterval(() => {
    const topBottom = Math.random() > 0.5 ? 'top': 'bottom'
    const leftRight = Math.random() > 0.5 ? 'left': 'right'
    const whereToStart = Math.random()
    const id = parseInt(Math.random() * 5)
    oldHor = (6000 * Math.random()) + 6000
    oldVer = (6000 * Math.random()) + 6000

    const $ship = $(`<div class="ship ai id-${id}" />`).css({
      [leftRight]: oldHor,
      [topBottom]: oldVer
    }).appendTo($world)

    setTimeout(() => {
      newHor = (6000 * Math.random()) - 6000
      newVer = (6000 * Math.random()) - 6000
      let angle = Math.atan2(newHor - oldHor, - (newVer - oldVer)) * (180 / Math.PI)
      if (topBottom === 'bottom' && leftRight === 'right') {
        angle = angle + 180
      } else if  (topBottom === 'bottom' && leftRight === 'left') {
        angle = angle - 90
      } else if  (topBottom === 'top' && leftRight === 'right') {
        angle = angle + 90
      }
      $ship.css({
        [leftRight]: newHor,
        [topBottom]: newVer,
        '-webkit-transform': 'rotate(' + angle + 'deg)',
        'transform': 'rotate(' + angle + 'deg)'
      })
    }, 50)

    setTimeout(() => {
      $ship.remove()
    }, 90000)
  }, 45000)
}

function setUpMovement () {
  $world.click((e) => {
    $world.stop(true, false).animate({
      left: parseInt($world.css('left')) + (((e.screenX - (screen.width - width)) - (width / 2)) * -1),
      top: parseInt($world.css('top')) + (((e.screenY - (screen.height - height)) - (height / 2)) * -1)
    })
    updateServerPlayerPosition((parseInt($world.css('left')) * -1) + width / 2, (parseInt($world.css('top')) * -1) + height / 2)
    updateCoordinates($(e.target))
  })
}

function updateCoordinates ($this) {
  let $tile = $this
  if ($this.hasClass('ship')) {
    return
  } else if (!$this.hasClass('tile')) {
    $this = $this.parents('.tile')
  }

  const left = $this.data('left') + 5
  const top = $this.data('top') + 5

  if ((!left && left !== 0) || (!top && top !== 0)) {
    return
  }

  $world.find('.co-ordinates').text(`${left}, ${top}`)

  if (map[left][top].system) {
    $world.find('.nearest-system').text(map[left][top].system.name)
  } else {
    $world.find('.nearest-system').text('unknown')
  }
}

function updateServerPlayerPosition (left, top) {
  socket.emit('playerMove', {
    player: player,
    x: left,
    y: top,
    ship: player.ship.id
  })
}

function setUpRotation ($ship) {
  $world.mousemove((e) => {
    const angle = Math.atan2((e.screenX - (screen.width - width)) - (width / 2), - ((e.screenY  - (screen.height - height)) - (height / 2))) * (180 / Math.PI)
    $ship.css({
      '-webkit-transform': 'rotate(' + angle + 'deg)',
      'transform': 'rotate(' + angle + 'deg)'
    })
  })
}

function getSystemPanel (tile) {
  if (!tile.system) {
    return ''
  }

  const planetsPanel = getPlanetsPanel(tile.system.planets)
  const name = tile.system.name
  const population = tile.system.population
  const top = tile.system.top * 95 + '%'
  const left = tile.system.left * 100 + '%'
  const type = getSystemType(tile.system.type)
  return `
    <div class="solar-system-tile" style="top: ${top}; left: ${left};">
      <h1 class="system-name">${name}</h1>
      <div class="system-type">${type}</div>
      <div class="system-population">${population}</div>
      ${planetsPanel}
    </div>
  `
}

function getPlanetsPanel (planets) {
  let planetsDiv = '<div class="planets-tile">'
  for (planet of planets) {
    const type = getSystemType(planet.type)
    planetsDiv += `
      <div class="planet">
        <div class="planet-name">${planet.name}</div>
        <div class="planet-type">${type}</div>
        <div class="planet-minerals">${planet.minerals.name}</div>
      </div>
    `
  }
  return planetsDiv += '</div>'
}

function getSystemType (id) {
  return [
    'dead',
    'dormant',
    'thriving'
  ][id]
}

function getSystemImage (tile) {
  if (!tile.system) {
    return ''
  }

  const top = tile.system.top * 100 + '%'
  const left = tile.system.left * 100 + '%'
  const type = tile.system.type + 1
  return `<img class="solar-system" style="top: ${top}; left: ${left};" src="images/space-${type}.png">`
}

function inform (tile) {
  // console.log(tile, tile.system)
}

function getPlayer () {
  let name = 'Bob Bobbingson'
  return new Player({
    name
  })
}

function getUI () {
  const $ui = getUIContainer()
  $ui.append(getPanelButtons($ui))
  $ui.append(getMapPanel())
  $ui.append(getPlayerPanel())
  $ui.append(getShipPanel())
  return $ui
}

function getUIContainer () {
  return $('<div class="ui-container open" />').click((e) => {
    e.stopImmediatePropagation()
  })
}

function getPanelButtons ($ui) {
  const $buttons = $(`
    <div class="tab-controllers">
      <div class="button map selected" data-type="map"></div>
      <div class="button player" data-type="player"></div>
      <div class="button ship" data-type="ship"></div>
    </div>
  `)
  $buttons.find('.button').click(function () {
    const $this = $(this)
    const isSelected = $this.hasClass('selected')

    $buttons.find('.selected').removeClass('selected')
    $ui.addClass('open')

    if (isSelected) {
      $ui.find('.tab').removeClass('show')
      $ui.removeClass('open')
    } else {
      const type = $this.addClass('selected').data('type')
      $ui.find('.tab').removeClass('show').siblings(`.${type}-tab`).addClass('show')
    }
  })
  return $buttons
}

function getMapPanel () {
  return $(`
    <div class="tab map-tab show" data-type="map">
      <div>
        <div class="co-ordinates header">5, 5</div>
        <div class="nearest-system header">unknown</div>
      </div>
    </div>
  `)
}

function getPlayerPanel () {
  return $(`
    <div class="tab player-tab" data-type="player">
      <div>
        <p class="name header">${player.name}</p>
        <p class="level header">${player.level}</p>
        <p class="money header">${player.money}</p>
      </div>
    </div>
  `)
}

function getShipPanel () {
  const weaponsHTML = getWeaponsHTML(player.ship.weapons)
  return $(`
    <div class="tab ship-tab" data-type="ship">
      <div>
        <div class="section ship-controls">
        </div>
        <div class="section ship-details">
          <p class="name header">${player.ship.name}</p>
          <p class="crew header">${player.ship.crew}</p>
          <p class="power header">${player.ship.maxPower}</p>
        </div>
        <div class="section weapon-details">
          ${weaponsHTML}
        </div>
      </div>
    </div>
  `)
}

function getWeaponsHTML (weapons) {
  let html = ''
  for (let weapon of weapons) {
    weapon = getWeapon(weapon)
    html += `
      <div class="weapon">
        <p class="name header">${weapon.name}</p>
        <p class="damage header">${weapon.damage}</p>
        <p class="accuracy header">${weapon.accuracy}</p>
        <p class="cooldown header">${weapon.cooldown}</p>
      </div>
    `
  }
  return html
}

function getShip (id) {
  let ships = [
    {
      id: 0,
      name: 'escape pod',
      weapons: [0],
      crew: 1,
      maxHealth: 25,
      health: 25,
      maxPower: 25,
      value: 45
    }
  ]
  return $.extend(ships[id], {
    power: {
      shields: 0,
      weapons: 0,
      engines: 0
    }
  })
}

function getWeapon (id) {
  const weapons = [
    {
      name: 'automatic laser',
      damage: 2,
      accuracy: 0.7,
      value: 4,
      cooldown: 0.5
    }
  ]
  return weapons[id]
}

function getFaction (id) {
  const factions = [
    {
      name: 'free',
      description: 'The few systems left that are able to call themselves "free" are the lucky few who have stayed out of the clutches of the many warring factions.'
    }
  ]
  return factions[id]
}

function Player (options) {
  this.name = options.name
  this.id = (this.name + '-' + (Date.now() - 0)).replace(/\s/g, '-')
  this.ship = getShip(0)
  this.tile = [5, 5]
  this.money = 0
  this.level = 1
  this.faction = ''
  this.direction = 0
  this.x = 0
  this.y = 0
  this.bounty = 0
}
