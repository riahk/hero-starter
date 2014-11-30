var helpers = {};

// Returns false if the given coordinates are out of range
// use to: 
//	-make sure you don't waste a move(i.e. try to go east when you're at edge of map
//	-determine whether you're in a corner (not a good place to be, should be avoided)
helpers.validCoordinates = function(board, distanceFromTop, distanceFromLeft) {
  return (!(distanceFromTop < 0 || distanceFromLeft < 0 ||
      distanceFromTop > board.lengthOfSide - 1 || distanceFromLeft > board.lengthOfSide - 1));
};

// Returns the tile [direction] (North, South, East, or West) of the given X/Y coordinate
// aka returns objects on the tiles adjacent to a spot on the board.
// can be used to assess surroundings, or find the closest mine/enemy/ally/heal spot
helpers.getTileNearby = function(board, distanceFromTop, distanceFromLeft, direction) {

  // These are the X/Y coordinates
  var fromTopNew = distanceFromTop;
  var fromLeftNew = distanceFromLeft;

  // This associates the cardinal directions with an X or Y coordinate
  if (direction === 'North') {
    fromTopNew -= 1;
  } else if (direction === 'East') {
    fromLeftNew += 1;
  } else if (direction === 'South') {
    fromTopNew += 1;
  } else if (direction === 'West') {
    fromLeftNew -= 1;
  } else {
    return false;
  }

  // If the coordinates of the tile nearby are valid, return the tile object at those coordinates
  if (helpers.validCoordinates(board, fromTopNew, fromLeftNew)) {
    return board.tiles[fromTopNew][fromLeftNew];
  } else {
    return false;
  }
};

// Returns an object with certain properties of the nearest object we are looking for
helpers.findNearestObjectDirectionAndDistance = function(board, fromTile, tileCallback) {
  // Storage queue to keep track of places the fromTile has been
  var queue = [];

  //Keeps track of places the fromTile has been for constant time lookup later
  var visited = {};

  // Variable assignments for fromTile's coordinates
  var dft = fromTile.distanceFromTop;
  var dfl = fromTile.distanceFromLeft;

  // Stores the coordinates, the direction fromTile is coming from, and it's location
  var visitInfo = [dft, dfl, 'None', 'START'];

  //Just a unique way of storing each location we've visited
  visited[dft + '|' + dfl] = true;

  // Push the starting tile on to the queue
  queue.push(visitInfo);

  // While the queue has a length
  while (queue.length > 0) {

    // Shift off first item in queue
    var coords = queue.shift();

    // Reset the coordinates to the shifted object's coordinates
    dft = coords[0];
    dfl = coords[1];

    // Loop through cardinal directions
    var directions = ['North', 'East', 'South', 'West'];
    for (var i = 0; i < directions.length; i++) {

      // For each of the cardinal directions get the next tile...
      var direction = directions[i];

      // ...Use the getTileNearby helper method to do this
      var nextTile = helpers.getTileNearby(board, dft, dfl, direction);

      // If nextTile is a valid location to move...
      if (nextTile) {

        // Assign a key variable the nextTile's coordinates to put into our visited object later
        var key = nextTile.distanceFromTop + '|' + nextTile.distanceFromLeft;

        var isGoalTile = false;
        try {
          isGoalTile = tileCallback(nextTile);
        } catch(err) {
          isGoalTile = false;
        }

        // If we have visited this tile before
        if (visited.hasOwnProperty(key)) {

          //Do nothing--this tile has already been visited

        //Is this tile the one we want?
        } else if (isGoalTile) {

          // This variable will eventually hold the first direction we went on this path
          var correctDirection = direction;

          // This is the distance away from the final destination that will be incremented in a bit
          var distance = 1;

          // These are the coordinates of our target tileType
          var finalCoords = [nextTile.distanceFromTop, nextTile.distanceFromLeft];

          // Loop back through path until we get to the start
          while (coords[3] !== 'START') {

            // Haven't found the start yet, so go to previous location
            correctDirection = coords[2];

            // We also need to increment the distance
            distance++;

            // And update the coords of our current path
            coords = coords[3];
          }

          //Return object with the following pertinent info
          var goalTile = nextTile;
          goalTile.direction = correctDirection;
          goalTile.distance = distance;
          goalTile.coords = finalCoords;
          return goalTile;

          // If the tile is unoccupied, then we need to push it into our queue
        } else if (nextTile.type === 'Unoccupied') {

          queue.push([nextTile.distanceFromTop, nextTile.distanceFromLeft, direction, coords]);

          // Give the visited object another key with the value we stored earlier
          visited[key] = true;
        }
      }
    }
  }

  // If we are blocked and there is no way to get where we want to go, return false
  return false;
};

//Returns the direction element of a tile returned by 
//helpers.findNearestObjectDirectionAndDistance
helpers.tileDirection = function(tile) {
  if(tile) {
    return tile.direction;
  } else { return false; }
};

//Returns the distance element of a tile returned by
//helpers.findNearestObjectDirectionAndDistance
helpers.tileDistance = function(tile) {
  if(tile) {
    return tile.distance;
  } else { return false; }
};

//Returns the coords of a tile returned by
//helpers.findNearestObjectDirectionAndDistance
helpers.tileCoords = function(tile) {
  if(tile) {
    return tile.coords;
  } else { return false; }
};

// Returns the direction of the nearest non-team diamond mine or false, if there are no diamond mines
// also takes into account the diamond mines owned by dead team members
helpers.findNearestNonTeamDiamondMine = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile) {
    if (mineTile.type === 'DiamondMine') {
      if (mineTile.owner) {
        if(mineTile.owner.dead) { //if the owner is dead, that mine is capturable (even if it's owned by a teammate
          return true;
        } else { return mineTile.owner.team !== hero.team; }
      } else {
        return true;
      }
    } else {
      return false;
    }
  }, board);

  //Return tile
  return pathInfoObject;
};

// Returns the nearest unowned diamond mine or false, if there are no diamond mines
helpers.findNearestUnownedDiamondMine = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile) {
    if (mineTile.type === 'DiamondMine') {
      if (mineTile.owner) {
        return mineTile.owner.id !== hero.id;
      } else {
        return true;
      }
    } else {
      return false;
    }
  });

  //Return tile
  return pathInfoObject;
};

helpers.findNearestTeamDiamondMine = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile) {
    if(mineTile.type === 'Diamond Mine') {
      if(mineTile.owner && !mineTile.owner.dead) { //checks that it has a LIVING owner
        return mineTile.owner.team == hero.team;
      } else { return true; }
    } else { return false; }
  });

  return pathInfoObject;

}

// Returns the nearest health well or false, if there are no health wells
helpers.findNearestHealthWell = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(healthWellTile) {
    return healthWellTile.type === 'HealthWell';
  });

  //Return tile
  return pathInfoObject;
};

// Returns the direction of the nearest enemy with lower health
// (or returns false if there are no accessible enemies that fit this description)
helpers.findNearestWeakerEnemy = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(enemyTile) {
    return enemyTile.type === 'Hero' && enemyTile.team !== hero.team && enemyTile.health < hero.health;
  });

  //Return tile
  //If no weaker enemy exists, will simply return false 
  if(pathInfoObject) {
    return pathInfoObject;
  } else { return false; }
};

// Returns the direction of the nearest enemy
// (or returns false if there are no accessible enemies)
helpers.findNearestEnemy = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(enemyTile) {
    return enemyTile.type === 'Hero' && enemyTile.team !== hero.team;
  });

  //Return tile
  return pathInfoObject;
};

// Returns the direction of the nearest friendly champion
// (or returns false if there are no accessible friendly champions)
helpers.findNearestTeamMember = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(heroTile) {
    return heroTile.type === 'Hero' && heroTile.team === hero.team;
  });

  //Return tile
  return pathInfoObject;
};


//Takes an object type, and finds the closest one (combines the above helper methods)
helpers.findClosestObjectOfType = function(type, gameData) {
  switch(type) {
    case 'NonTeamDiamondMine':
      return helpers.findNearestNonTeamDiamondMine(gameData);
      break;
    case 'TeamDiamondMine':
      return helpers.findNearestTeamDiamondMine(gameData);
      break;
    case 'UnownedDiamondMine':
      return helpers.findNearestUnownedDiamondMine(gameData);
      break;
    case 'HealthWell':
      return helpers.findNearestHealthWell(gameData);
      break;
    case 'WeakerEnemy':
      return helpers.findNearestWeakerEnemy(gameData);
      break;
    case 'Enemy':
      return helpers.findNearestEnemy(gameData);
      break;
    case 'TeamMember':
      return helpers.findNearestEnemy(gameData);
      break;
  }
};
      

//Compares two objects and determines which one is closer (return that tile)
//if the tiles are equal distance away, return false
helpers.findCloserTile = function(tile1, tile2) {
  var distance1 = helpers.tileDistance(tile1);
  var distance2 = helpers.tileDistance(tile2);

  if(distance1 === distance2) {
    return false;
  } else if(distance1 < distance2) {
    return tile1;
  } else { return tile2; }
};


//scans for the certain object type within a given range from a start point
//startx is distancefromleft, starty is distancefromtop
//stores all matching items in an array, returns false if no objects are found
//return false if start tile is invalid
//
//note: tiles are defined as board.tiles[distfromtop][distfromleft] (aka y,x format)
helpers.scanForTilesofType = function(desiredType, startx, starty, range, gameData) {
  var board = gameData.board;
  var x; //distance from left
  var y; //distance from top
  //check that start point is a valid tile
  if(!(helpers.validCoordinates(board, startx, starty))) {
    return false;
  }
  
  var tiles = []; //a queue for tiles to check
  var validTiles = []; //for all tiles that match the desired type

  if(range > 0) { //get all surrounding tiles using embedded for loops

    //get tiles from each subsequent layer, starting at the inside and moving outward

    var max = range; //the number of layers to search through
    var layer; //keep track of the layer we're on, 1-max
    var left; //left limit for the layer
    var right; //right limit for the layer
    var height; //distance between top and bottom square
    var midpoint = startx; //does not change

    for(layer = 1; layer <= max; layer++) {
      left = startx - range;
      right = startx + range;
      y = starty;
      height = 0;
      for(x = left; x <= right; x++) {
        //add tiles, if valid
        if(helpers.validCoordinates(board, y, x)) {
          tiles.push(board.tiles[y][x]);
          if(height > 0) {
            if(helpers.validCoordinates(board, y + height, x)) {
              tiles.push(board.tiles[y + height][x]);
            }
          }
        }

        //determine whether to increment or decrement y and height
        if(x >= midpoint) {
        height -= 2;
        y--;
        } else { height += 2; y++; }
      }
    }
  }
    

    //check type of each tile
  while(tiles.length > 0) {
    var tile = tiles.pop();
    if(tile.type === desiredType) { //check if tile matches qualifications
      validTiles.push(tile);
    }
  }
  return validTiles;
};

//function to give the opposite direction
helpers.oppositeDirection = function(direction) {
  switch(direction) {
    case 'North':
      return 'South';
      break;
    case 'South':
      return 'North';
      break;
    case 'West':
      return 'East';
      break;
    case 'East':
      return 'West';
      break;
    default:
      return 'Stay';
  }
}

//scan the current diamond mine status (determines number of team, enemy and unowned diamond mines on map
//returns an array, stats[0] = number of team mines; stats[1] = number of non-team mines; stats[2] = total mines
helpers.mineStats = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;
  var currentTile;

  var teamMines;
  var nonTeamMines;
  var totalMines;

  var mineTiles = helpers.scanForTilesofType('DiamondMine', hero.distanceFromLeft, hero.distanceFromTop, 5, gameData);

  totalMines = mineTiles.length;

  for(var i = 0; i < mineTiles.length; i++) { //cycle through the minetiles
    currentTile = mineTiles[i];
    if(currentTile.owner && currentTile.owner.team == hero.team) {
      teamMines++;
    } else { nonTeamMines++; }
  }

  var stats = [];
  stats.push(teamMines);
  stats.push(nonTeamMines);
  stats.push(totalMines);

  return stats;
}

module.exports = helpers;
