import * as _ from 'lodash'
import * as pAll from 'p-all'
import * as path from 'path'
import * as magneturi from 'magnet-uri'
import * as utils from '@/utils/utils'
import * as http from '@/adapters/http'
import * as debrid from '@/debrids/debrid'

export const client = new http.Http({
	baseUrl: 'https://api.real-debrid.com/rest/1.0',
	query: {
		auth_token: process.env.REALDEBRID_SECRET,
	},
})

export class RealDebrid implements debrid.Debrid {
	async getCached(hashes: string[]) {
		hashes = hashes.map(v => v.toLowerCase())
		let chunks = _.chunk(hashes, 40)
		return (await pAll(
			chunks.map((chunk, index) => async () => {
				await utils.pRandom(300)
				let url = `/torrents/instantAvailability/${hashes.join('/')}`
				let response = (await client.get(url, {
					memoize: true,
					verbose: true,
				})) as CacheResponse
				return chunk.map(hash => _.size(_.get(response, `${hash}.rd`, [])) > 0)
			}),
			{ concurrency: 1 }
		)).flat()
	}

	async links(magnet: string) {
		console.warn(`links magnet ->`, magnet)
		let decoded = magneturi.decode(magnet)

		let items = (await client.get('/torrents', {
			verbose: true,
		})) as Item[]
		let item = items.find(v => v.hash == decoded.infoHash)

		if (!item) {
			let download = (await client.post('/torrents/addMagnet', {
				form: { magnet },
				verbose: true,
			})) as Download

			item = (await client.get(`/torrents/info/${download.id}`, {
				verbose: true,
			})) as Item

			let files = item.files.filter(file => {
				let name = utils.minify(path.basename(file.path))
				return utils.isVideo(file.path) && !name.includes('sample')
			})
			await client.post(`/torrents/selectFiles/${download.id}`, {
				form: { files: files.map(v => v.id).join() },
				verbose: true,
			})

			item = (await client.get(`/torrents/info/${download.id}`, {
				verbose: true,
			})) as Item
		}

		let downloads = await pAll(
			item.links.map(link => async () => {
				await utils.pRandom(300)
				return (await client.post(`/unrestrict/link`, {
					form: { link },
					verbose: true,
				})) as Unrestrict
			}),
			{ concurrency: 1 }
		)
		return downloads.map(v => v.download)

		// if (items.map(v => v.hash).includes(decoded.infoHash)) {
		// 	console.warn(`Download already exists ->`, decoded.name)
		// 	return
		// }

		// let downloads = (await client.post(`/unrestrict/link`, {
		// 	form: { link: item.links.join() },
		// 	verbose: true,
		// })) as Unrestrict[]

		// let downloads = [] as Unrestrict[]
		// if (item.links.length == 1) {
		// 	downloads = await client.post(`/unrestrict/link`, {
		// 		form: { link: item.links[0] },
		// 		verbose: true,
		// 	})
		// } else if (item.links.length > 1) {
		// 	downloads = await client.post(`/unrestrict/folder`, {
		// 		form: { link: item.links[0] },
		// 		verbose: true,
		// 	})
		// }
	}
}
export const realdebrid = new RealDebrid()

type CacheResponse = Record<string, { rd: CacheFiles[] }>
type CacheFiles = Record<string, { filename: string; filesize: number }>

interface Download {
	id: string
	uri: string
}

interface File {
	bytes: number
	id: number
	path: string
	selected: number
}

interface Item {
	added: string
	bytes: number
	filename: string
	files: File[]
	hash: string
	host: string
	id: string
	links: string[]
	original_bytes: number
	original_filename: string
	progress: number
	seeders: number
	speed: number
	split: number
	status: Status
}

interface Unrestrict {
	chunks: number
	crc: number
	download: string
	filename: string
	filesize: number
	host: string
	host_icon: string
	id: string
	link: string
	mimeType: string
	streamable: number
}

interface ActiveCount {
	limit: number
	nb: number
}

type Status =
	| 'magnet_error'
	| 'magnet_conversion'
	| 'waiting_files_selection'
	| 'queued'
	| 'downloading'
	| 'downloaded'
	| 'error'
	| 'virus'
	| 'compressing'
	| 'uploading'
	| 'dead'