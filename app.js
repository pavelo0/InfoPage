import { API_KEY } from './config.js'

const CHUNK_SIZE = 15
let allBreads = []
let currentIndex = 0
let observer

function validInputValue(value) {
	const trimmed = value.trim()
	const normalized = trimmed.replace(',', '.')
	const parsed = parseFloat(normalized)

	if (!isNaN(parsed) && parsed > 0 && parsed <= 67) {
		const validValue = Math.floor(parsed)
		return validValue
	} else {
		return null
	}
}
function showError() {
	const errorText = document.getElementById('error-text')
	const inputText = document.getElementById('quantity-input')
	inputText.style.outline = '2px solid red'
	errorText.style.display = 'block'
}
function hideError() {
	const errorText = document.getElementById('error-text')
	errorText.style.display = 'none'
}
async function getCatBreeds(limit) {
	const headers = {
		'Content-Type': 'application/json',
		'x-api-key': API_KEY,
	}

	try {
		const breedsRes = await fetch(
			`https://api.thecatapi.com/v1/breeds?limit=${limit}`,
			{ headers }
		)
		const photosRes = await fetch(
			`https://api.thecatapi.com/v1/images/search?limit=${limit}`,
			{ headers }
		)
		if (!breedsRes.ok || !photosRes.ok)
			throw new Error(`Bad request: ${breedsRes.status}, ${photos.status}`)
		else {
			const [breeds, photos] = await Promise.all([
				breedsRes.json(),
				photosRes.json(),
			])
			const data = breeds.map((breed, id) => ({
				...breed,
				image: photos[id]?.url,
			}))
			return data
		}
	} catch (error) {
		return `Something went wrong: ${error}`
	}
}
function showCatBreeds(data) {
	const container = document.getElementById('gallery-breeds')

	data.forEach(breed => {
		const { name, wikipedia_url, image } = breed

		const card = document.createElement('div')
		const cardImage = document.createElement('img')
		const cardTitle = document.createElement('h3')
		const cardWiki = document.createElement('a')
		const cardWikiBtn = document.createElement('button')

		card.classList.add('cat-gallery__breed')
		cardImage.classList.add('cat-gallery__breed__photo')
		cardTitle.classList.add('cat-gallery__breed__title')
		cardWiki.classList.add('cat-gallery__breed__wiki')
		cardWikiBtn.classList.add('cat-gallery__breed__wiki-btn')

		cardImage.loading = 'lazy'
		cardTitle.textContent = `${name}`
		cardWiki.href = `${wikipedia_url}`
		cardWiki.target = '_blank'
		cardImage.src = `${image}`
		cardWikiBtn.textContent = 'Check wiki'
		cardWiki.appendChild(cardWikiBtn)
		card.append(cardTitle, cardWiki, cardImage)
		container.appendChild(card)
	})
}
function showNextChunk() {
	const nextChunk = allBreads.slice(currentIndex, currentIndex + CHUNK_SIZE)

	if (nextChunk.length === 0) {
		observer.disconnect()
	}
	showCatBreeds(nextChunk)
	currentIndex += nextChunk.length
}

function main() {
	function initObserver() {
		const sentinel = document.getElementById('sentinel')

		observer = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					if (entry.isIntersecting) showNextChunk()
				})
			},
			{
				root: null,
				rootMargin: '1px',
				threshold: 0,
			}
		)

		observer.observe(sentinel)
	}

	const confirmBtn = document.getElementById('confirm-btn')
	document.addEventListener('keydown', event => {
		if (event.key === 'Enter') confirmBtn.click()
	})
	confirmBtn.addEventListener('click', async () => {
		const container = document.getElementById('gallery-breeds')
		if (container.textContent !== '') container.innerHTML = ''

		const inputTextValue = document.getElementById('quantity-input').value
		const validValue = validInputValue(inputTextValue)

		if (validValue === null) {
			showError()
		} else {
			hideError()
			allBreads = await getCatBreeds(validValue)
			showNextChunk()
			initObserver()
		}
	})
}

main()
