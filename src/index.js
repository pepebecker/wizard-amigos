const regl = require('regl')()
const glm = require('gl-matrix')
const obj = require('webgl-obj-loader')

const pixels = require('./pixels.json')
const cubeObj = require('./cube.obj')
const shader = require('./shader.glsl')

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const getColor = (pixels, x, y, z) => {
  return pixels.data[pixels.offset + pixels.stride[0] * x + pixels.stride[1] * y + pixels.stride[2] * z]
}

const getProjection = () => {
  const matrix = new Float32Array(16)
  const fovy = glm.glMatrix.toRadian(45)
  const aspect = window.innerWidth / window.innerHeight
  const near = 0.1
  const far = 1000.0
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
  const matrix = new Float32Array(16)
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
  getPosition: function () {
    return this.position
  },
  getTransform: function () {
    const matrix = new Float32Array(16)
    glm.mat4.identity(matrix)
    glm.mat4.rotate(matrix, matrix, glm.glMatrix.toRadian(world.rotation.x), [1, 0, 0])
    glm.mat4.rotate(matrix, matrix, glm.glMatrix.toRadian(world.rotation.y), [0, 1, 0])
    glm.mat4.rotate(matrix, matrix, glm.glMatrix.toRadian(world.rotation.z), [0, 0, 1])
    glm.mat4.translate(matrix, matrix, [this.getPosition().x, this.getPosition().y, this.getPosition().z])
    glm.mat4.scale(matrix, matrix, [1, 1, 1])
    return matrix
  },
  update: function () {
    this.position.x -= (this.position.x - this.destination.x) * 0.1
    this.position.y -= (this.position.y - this.destination.y) * 0.1
    this.position.z -= (this.position.z - this.destination.z) * 0.1
  },
  draw: regl({
    frag: shader.fragment,
    vert: shader.vertex,

    attributes: {
      position: function () {
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

start()

function start () {
  window.cubes = []

  const cubeMesh = new obj.Mesh(cubeObj)
  const imageWidth = pixels.shape[0]
  const imageHeight = pixels.shape[1]

  for (let y = 0; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      const offsetX = -imageWidth / 2
      const offsetY = -imageHeight / 2
      const r = getColor(pixels, x, y, 0)
      const g = getColor(pixels, x, y, 1)
      const b = getColor(pixels, x, y, 2)
      const color = [r, g, b, 255]
      if (r !== 0 || g !== 255 || b !== 0) {
        const transform = {
          x: x + offsetX,
          y: -y - offsetY,
          z: randomInt(-80, 80) - 40
        }
        cubes.push(new Cube(cubeMesh, transform, color))
      }
    }
  }

  camera.position.z = 80

  regl.frame(() => {
    regl.clear({
      color: [1, 1, 1, 0],
      depth: 1
    })

    for (let i = 0; i < cubes.length; i++) {
      cubes[i].update()
      cubes[i].draw()
    }
  })
}

document.onmousemove = (event) => {
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1
  const mouseY = (event.clientY / window.innerHeight) * 2 - 1
  world.rotation.y = mouseX * 50
  world.rotation.x = mouseY * 50
}
