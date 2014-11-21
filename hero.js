/*

  CURRENT STRATEGY: AGGRESSOR

  Strategies for the hero are contained within the "moves" object as
  name-value pairs, like so:

    //...
    ambusher : function(gamedData, helpers){
      // implementation of strategy.
    },
    heWhoLivesToFightAnotherDay: function(gamedData, helpers){
      // implementation of strategy.
    },
    //...other strategy definitions.

  The "moves" object only contains the data, but in order for a specific
  strategy to be implemented we MUST set the "move" variable to a
  definite property.  This is done like so:

  move = moves.heWhoLivesToFightAnotherDay;

  You MUST also export the move function, in order for your code to run
  So, at the bottom of this code, keep the line that says:

  module.exports = move;

  The "move" function must return "North", "South", "East", "West", or "Stay"
  (Anything else will be interpreted by the game as "Stay")

  The "move" function should accept two arguments that the website will be passing in:
    - a "gameData" object which holds all information about the current state
      of the battle

    - a "helpers" object, which contains useful helper functions
      - check out the helpers.js file to see what is available to you

    (the details of these objects can be found on javascriptbattle.com/#rules)

  Such is the power of Javascript!!!

  Notes on Basic Rules:

  win_conditions = kill_all_opponents || more_diamonds_after_1250_turns

  movements choices: North, South, East, West, Stay (default)

  if(hp <= 0) { status = dead; }
  initial_hp = 100;

  diamond mines deal 20 dmg upon capture (aka: don't capture a diamond mine if low on hp)
  capture mine by moving into it

  earn 1 diamond per owned mine per turn

  to regain hp:
	move into health well (hp_restore = 30)
	move into ally to restore THEIR hp (hp_restore = 40)

  to attack enemies:
	enemies attacked AUTOMATICALLY at END OF TURN.
	deal 20 dmg to ALL ADJACENT ENEMIES
	can also deal extra 10 dmg by moving into enemy

  Notes on Strategy:

  The best way to win seems to be to hold as many diamonds as possible. If even one of the
  opposing team survives, it is important to have diamond mines. (of course, reducing the 
  enemy's numbers also reduces their potential for diamond yield.) 

  An ideal character will: maintain their hp, and prioritize capturing diamond mines. only
  attack opponents when your diamond status is good.
  This would be best achieved by:
	1) assessing the current diamond mine status:
		-how many diamond mines does your team own?
		-if your team does not hold all diamond mines, where is the nearest enemy
		occupied mine? is it heavily guarded (i.e. a great deal of enemies would
		likely result in death)
		-are any of the team's mines being threatened? if a mine is threatened,
		the threat should be eliminated. define a threat as an enemy within two
		spaces of a mine.
	2) if the current mine status is satisfactory, the next best thing is to go after 
	   enemy players. OR: stay at a mine to defend it from incoming enemies.

  Helper Methods:

  helpers.validCoordinates(board, distanceFromTop, distanceFromLeft)
	determines whether the given coordinates are on the map (returns true/false)

  helpers.getTileNearby(board, distanceFromTop, distanceFromLeft, direction)
	returns the object on one of the adjacent tiles from given coordinate (north, south,
	east or west)

  helpers.findNearestObjectDirectionAndDistance(board, fromTile, tileCallback)
	returns the nearest tile matching given conditions(tileCallback)
	called in functions to find nearest unowned mine, heal well, etc.
	returns object with direction and distance from initial location and coords

  helpers.findNearestNonTeamDiamondMine(gameData)
	returns direction towards nearest non-team diamond mine
	returns false if none

  helpers.findNearestUnownedDiamondMine(gameData)
	returns diretion towards nearest unowned diamond mine
	returns false if none

  helpers.findNearestHealthWell(gameData)
/	returns direction towards nearest heal well
	returns false if none

  helpers.findNearestWeakerEnemy(gameData)
	returns direction of nearest low-hp enemy (hp less than the hero's)

  helpers.findNearestEnemy = function(gameData)
	returns direction of nearest enemy

  helpers.findNearestTeamMember(gameData)
	returns direction of nearest team member

*/

// Strategy definitions
var moves = {
  // Aggressor
  aggressor: function(gameData, helpers) {
    // Here, we ask if your hero's health is below 30
    if (gameData.activeHero.health <= 30){
      // If it is, head towards the nearest health well
      var tile = helpers.findNearestHealthWell(gameData);
      return helpers.tileDirection(tile);
    } else {
      // Otherwise, go attack someone...anyone.
      var tile = helpers.findNearestEnemy(gameData);
      return helpers.tileDirection(tile);
    }
  },

  // Health Nut
  healthNut:  function(gameData, helpers) {
    // Here, we ask if your hero's health is below 75
    if (gameData.activeHero.health <= 75){
      // If it is, head towards the nearest health well
      var tile = helpers.findNearestHealthWell(gameData);
      return helpers.tileDirection(tile);
    } else {
      // Otherwise, go mine some diamonds!!!
      var tile = helpers.findNearestNonTeamDiamondMine(gameData);
      return helpers.tileDirection(tile);
    }
  },

  // Balanced
  balanced: function(gameData, helpers){
    /*
    //under construction
    var myHero = gameData.activeHero;
    //first, check hp
    if(myHero.health <= 50) { //if at half health, find nearest heal well
      var nearestWell = helpers.findClosestObjectOfType('HealthWell', gameData);
      if(nearestWell
    */
  },

  // The "Northerner"
  // This hero will walk North.  Always.
  northener : function(gameData, helpers) {
    var myHero = gameData.activeHero;
    return 'North';
  },

  // The "Blind Man"
  // This hero will walk in a random direction each turn.
  blindMan : function(gameData, helpers) {
    var myHero = gameData.activeHero;
    var choices = ['North', 'South', 'East', 'West'];
    return choices[Math.floor(Math.random()*4)];
  },

  // The "Priest"
  // This hero will heal nearby friendly champions.
  priest : function(gameData, helpers) {
    var myHero = gameData.activeHero;
    if (myHero.health < 60) {
      var tile = helpers.findNearestHealthWell(gameData);
      return helpers.tileDirection(tile);
    } else {
      var tile = helpers.findNearestTeamMember(gameData);
      return helpers.tileDirection(tile);
    }
  },

  // The "Unwise Assassin"
  // This hero will attempt to kill the closest enemy hero. No matter what.
  unwiseAssassin : function(gameData, helpers) {
    var myHero = gameData.activeHero;
    if (myHero.health < 30) {
      var tile = helpers.findNearestHealthWell(gameData);
      return helpers.tileDirection(tile);
    } else {
      var tile = helpers.findNearestEnemy(gameData);
      return helpers.tileDirection(tile);
    }
  },

  // The "Careful Assassin"
  // This hero will attempt to kill the closest weaker enemy hero.
  carefulAssassin : function(gameData, helpers) {
    var myHero = gameData.activeHero;
    if (myHero.health < 50) {
      var tile = helpers.findNearestHealthWell(gameData);
      return helpers.tileDirection(tile);
    } else {
      var tile = helpers.findNearestWeakerEnemy(gameData);
      return helpers.tileDirection(tile);
    }
  },

  // The "Safe Diamond Miner"
  // This hero will attempt to capture enemy diamond mines.
  safeDiamondMiner : function(gameData, helpers) {
    var myHero = gameData.activeHero;

    //Get stats on the nearest health well
    var healthWellStats = helpers.findNearestObjectDirectionAndDistance(gameData.board, myHero, function(boardTile) {
      if (boardTile.type === 'HealthWell') {
        return true;
      }
    });
    var distanceToHealthWell = helpers.tileDistance(healthWellStats);
    var directionToHealthWell = helpers.tileDirection(healthWellStats);

    if (myHero.health < 40) {
      //Heal no matter what if low health
      return directionToHealthWell;
    } else if (myHero.health < 100 && distanceToHealthWell === 1) {
      //Heal if you aren't full health and are close to a health well already
      return directionToHealthWell;
    } else {
      //If healthy, go capture a diamond mine!
      return helpers.findNearestNonTeamDiamondMine(gameData);
    }
  },

  // The "Selfish Diamond Miner"
  // This hero will attempt to capture diamond mines (even those owned by teammates).
  selfishDiamondMiner :function(gameData, helpers) {
    var myHero = gameData.activeHero;

    //Get stats on the nearest health well
    var healthWellStats = helpers.findNearestObjectDirectionAndDistance(gameData.board, myHero, function(boardTile) {
      if (boardTile.type === 'HealthWell') {
        return true;
      }
    });

    var distanceToHealthWell = helpers.tileDistance(healthWellStats);
    var directionToHealthWell = helpers.tileDirection(healthWellStats);

    if (myHero.health < 40) {
      //Heal no matter what if low health
      return directionToHealthWell;
    } else if (myHero.health < 100 && distanceToHealthWell === 1) {
      //Heal if you aren't full health and are close to a health well already
      return directionToHealthWell;
    } else {
      //If healthy, go capture a diamond mine!
      var tile = helpers.findNearestUnownedDiamondMine(gameData);
      return helpers.tileDirection(tile);
    }
  },

  // The "Coward"
  // This hero will try really hard not to die.
  coward : function(gameData, helpers) {
      var tile = helpers.findNearestHealthWell(gameData);
      return helpers.tileDirection(tile);
  }
 };

//  Set our heros strategy
var  move =  moves.aggressor;

// Export the move function here
module.exports = move;
