'use strict'

const path = require('path')
const through = require('through2')

module.exports = function (file) {
	if (path.extname(file).toLowerCase() !== '.glsl') {
		return through()
	}

	const parts = []
	return through(function (part, enc, next) {
		parts.push(part)
		next()
	}, function (done) {
		let data = parts.join('')

		const shaders = data.split('[vertex]')[1].split('[fragment]')
		const content = `module.exports = {
			vertex: \`${shaders[0]}\`,
			fragment: \`${shaders[1]}\`,
		}`

		this.push(content)
		done()
	})
}