
class ReturnGameObjectHome {
  static returnAll(gameObjects) {
    return gameObjects.forEach(gameObject => ReturnGameObjectHome.return(gameObject))
  }

  static return(a, b) {}
}

module.exports = ReturnGameObjectHome;
