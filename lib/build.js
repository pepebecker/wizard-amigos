'use strict'

const getPixels = require('get-pixels')
const fs = require('fs')

getPixels('src/logo.png', (err, pixels) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
	fs.writeFile('src/pixels.json', JSON.stringify(pixels), 'utf-8', (err) => {
		if (err) {
			console.error(err)
			process.exit(1)
		}
		console.log('The file has been saved!')
	})
})
