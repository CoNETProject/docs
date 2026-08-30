#!/usr/bin/env node
/**
 * HonKit ships a default theme favicon. After `honkit build`, overwrite it
 * with the CoNET mark and publish a root /favicon.ico (theme-only path
 * used to 404 at the site root).
 */
const fs = require('fs')
const path = require('path')

const root = __dirname
const styles = path.join(root, 'styles')
const book = path.join(root, '_book')
const themeImages = path.join(book, 'gitbook', 'images')

function mustCopy(srcName, dest) {
	const src = path.join(styles, srcName)
	if (!fs.existsSync(src)) {
		throw new Error(`missing CoNET favicon source: ${src}`)
	}
	fs.mkdirSync(path.dirname(dest), { recursive: true })
	fs.copyFileSync(src, dest)
}

if (!fs.existsSync(book)) {
	throw new Error('HonKit _book/ is missing; run honkit build first')
}

mustCopy('favicon.ico', path.join(book, 'favicon.ico'))
mustCopy('favicon.ico', path.join(themeImages, 'favicon.ico'))
mustCopy('favicon-16x16.png', path.join(book, 'favicon-16x16.png'))
mustCopy('favicon-32x32.png', path.join(book, 'favicon-32x32.png'))
mustCopy('favicon-32x32.png', path.join(themeImages, 'favicon-32x32.png'))
mustCopy('apple-touch-icon-152.png', path.join(themeImages, 'apple-touch-icon-precomposed-152.png'))
mustCopy('apple-touch-icon.png', path.join(book, 'apple-touch-icon.png'))

const bust = 'v=conet-20260830'
const walk = (dir) => {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name)
		if (entry.isDirectory()) {
			walk(full)
			continue
		}
		if (!entry.name.endsWith('.html')) continue
		const before = fs.readFileSync(full, 'utf8')
		const after = before
			.replace(
				/(href=")([^"?]*gitbook\/images\/favicon\.ico)(?:\?[^"]*)?(")/g,
				`$1$2?${bust}$3`,
			)
			.replace(
				/(href=")([^"?]*gitbook\/images\/apple-touch-icon-precomposed-152\.png)(?:\?[^"]*)?(")/g,
				`$1$2?${bust}$3`,
			)
		if (after !== before) {
			fs.writeFileSync(full, after)
		}
	}
}
walk(book)

console.log('copied CoNET favicon into _book/')
