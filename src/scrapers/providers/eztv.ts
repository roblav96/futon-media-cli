import * as _ from 'lodash'
import * as http from '@/adapters/http'
import * as scraper from '@/scrapers/scraper'
import * as utils from '@/utils/utils'

export const client = scraper.Scraper.http({
	baseUrl: 'https://eztv.io/api',
	headers: { 'content-type': 'application/json' },
	query: { limit: 100, page: 1 } as Partial<Query>,
})

export class Eztv extends scraper.Scraper {
	concurrency = 1
	max = 1

	slugs() {
		return this.item.ids.imdb ? [this.item.ids.imdb.replace(/\D/g, '')] : []
	}

	async getResults(imdb_id: string) {
		if (!this.item.show) return []
		let response = (await client.get('/get-torrents', {
			query: { imdb_id } as Partial<Query>,
		})) as Response
		let results = (response.torrents || []).filter(v => {
			let season = _.parseInt(v.season)
			let episode = _.parseInt(v.episode)
			if (this.item.E.a && utils.includes(v.title, this.item.E.a)) {
				return true
			}
			if (this.item.E.t && utils.accuracy(v.title, this.item.E.t)) {
				return true
			}
			if (this.item.S.n && season && this.item.E.n && episode) {
				return this.item.S.n == season && this.item.E.n == episode
			}
			if (this.item.S.n && season && this.item.S.n == season) {
				return true
			}
		})
		return results.map(v => {
			return {
				bytes: _.parseInt(v.size_bytes),
				magnet: v.magnet_url,
				name: v.title,
				seeders: v.seeds,
				stamp: new Date(v.date_released_unix * 1000).valueOf(),
			} as scraper.Result
		})
	}
}

interface Query {
	imdb_id: string
	limit: number
	page: number
}

interface Response {
	imdb_id: string
	limit: number
	page: number
	torrents: Result[]
	torrents_count: number
}

interface Result {
	date_released_unix: number
	episode: string
	episode_url: string
	filename: string
	hash: string
	id: number
	imdb_id: string
	large_screenshot: string
	magnet_url: string
	peers: number
	season: string
	seeds: number
	size_bytes: string
	small_screenshot: string
	title: string
	torrent_url: string
}
