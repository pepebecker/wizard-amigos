const regl = require('regl')()
const glm = require('gl-matrix')
const obj = require('webgl-obj-loader')
const getPixels = require("get-pixels")
const cubeObj = require('./cube.obj')

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const shader = {
  vertex: () => {
    return `
    precision mediump float;
    attribute vec3 position;
    uniform mat4 projection;
    uniform mat4 view;
    uniform mat4 transform;
    void main () {
      gl_Position = projection * view * transform * vec4(position, 1);
    }`
  },
  fragment: () => {
    return `precision mediump float;
    uniform vec4 color;
    void main () {
      gl_FragColor = color / 255.0;
    }`
  }
}

const getProjection = () => {
  var matrix = new Float32Array(16)
  var fovy = glm.glMatrix.toRadian(45)
  var aspect = window.innerWidth / window.innerHeight
  var near = 0.1
  var far = 1000.0
  glm.mat4.perspective(matrix, fovy, aspect, near, far)
  return matrix
}

const camera = {
  position: { x: 0, y: 0, z: 0},
  rotation: { x: 0, y: 0, z: 0}
}

const world = {
  position: { x: 0, y: 0, z: 0},
  rotation: { x: 0, y: 0, z: 0}
}

const getView = () => {
  var matrix = new Float32Array(16)
  glm.mat4.identity(matrix)
  glm.mat4.rotate(matrix, matrix, glm.glMatrix.toRadian(camera.rotation.x), [1, 0, 0])
  glm.mat4.rotate(matrix, matrix, glm.glMatrix.toRadian(camera.rotation.y), [0, 1, 0])
  glm.mat4.rotate(matrix, matrix, glm.glMatrix.toRadian(camera.rotation.z), [0, 0, 1])
  glm.mat4.translate(matrix, matrix, [-camera.position.x, -camera.position.y, -camera.position.z])
  return matrix
}

function Cube (model, position, color) {
  this.model = model
  this.position = position
  this.color = color
  this.destination = { x: position.x, y: position.y, z: 0 }
  this.position = { x: position.x + randomInt(-40, 40), y: position.y + randomInt(-40, 40), z: position.z }
}

Cube.prototype = {
  getPosition: function() {
    return this.position
  },
  getTransform: function() {
    var matrix = new Float32Array(16)
    glm.mat4.identity(matrix)
    glm.mat4.rotate(matrix, matrix, glm.glMatrix.toRadian(world.rotation.x), [1, 0, 0])
    glm.mat4.rotate(matrix, matrix, glm.glMatrix.toRadian(world.rotation.y), [0, 1, 0])
    glm.mat4.rotate(matrix, matrix, glm.glMatrix.toRadian(world.rotation.z), [0, 0, 1])
    glm.mat4.translate(matrix, matrix, [this.getPosition().x, this.getPosition().y, this.getPosition().z])
    glm.mat4.scale(matrix, matrix, [1, 1, 1])
    return matrix
  },
  update: function() {
    this.position.x -= (this.position.x - this.destination.x) * 0.1
    this.position.y -= (this.position.y - this.destination.y) * 0.1
    this.position.z -= (this.position.z - this.destination.z) * 0.1
  },
  draw: regl({
    frag: shader.fragment,
    vert: shader.vertex,

    attributes: {
      position: function() {
        return this.model.vertices
      }
    },

    uniforms: {
      transform: function () { return this.getTransform() },
      view: getView,
      projection: getProjection,
      color: function () {
        return this.color
      }
    },

    elements: function () {
      return this.model.indices
    },

    cull: {
      enable: true,
      face: 'back'
    }
  })
}

getPixels("Logo.png", (err, pixels) => {
  if(err) {
    console.log("Bad image path")
    return
  }

  window.cubes = []

  let cubeObj = new obj.Mesh(cubeObj)
  let imageWidth = pixels.shape[0]
  let imageHeight = pixels.shape[1]

  for (let y = 0; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      let offsetX = -imageWidth / 2
      let offsetY = -imageHeight / 2
      let r = pixels.get(x, y, 0)
      let g = pixels.get(x, y, 1)
      let b = pixels.get(x, y, 2)
      let color = [r, g, b, 255]
      if (!(r === 0 && g === 255 && b === 0)) {
        let color = [r, g, b, 255]
        let cube = new Cube(cubeObj, { x: x + offsetX, y: -y - offsetY, z: -40 + randomInt(-80, 80) }, color)
        cubes.push(cube)
      }
    }
  }

  console.log('Everything is loaded');

  camera.position.z = 80

  regl.frame(() => {
    regl.clear({
      color: [1, 1, 1, 1],
      depth: 1
    })

    for (let i = 0; i < cubes.length; i++) {
      cubes[i].update()
      cubes[i].draw()
    }
  })
})

document.onmousemove = function (e) {
  let mouseX = (e.clientX / window.innerWidth) * 2 - 1
  let mouseY = (e.clientY / window.innerHeight) * 2 - 1
  world.rotation.y = mouseX * 50
  world.rotation.x = mouseY * 50
}
