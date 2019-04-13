import * as _ from 'lodash'
import * as pAll from 'p-all'
import * as path from 'path'
import * as qs from 'query-string'
import * as magneturi from 'magnet-uri'
import * as utils from '@/utils/utils'
import * as http from '@/adapters/http'
import * as media from '@/media/media'
import * as filters from '@/scrapers/filters'
import * as trackers from '@/scrapers/trackers-list'
import * as torrent from '@/scrapers/torrent'
import * as debrid from '@/debrids/debrid'

export async function scrapeAll(...[item, rigorous]: ConstructorParameters<typeof Scraper>) {
	let providers = [
		// (await import('./providers/eztv')).Eztv,
		(await import('./providers/rarbg')).Rarbg,
		(await import('./providers/snowfl')).Snowfl,
		(await import('./providers/solidtorrents')).SolidTorrents,
		// (await import('./providers/yts')).Yts,
	] as typeof Scraper[]

	let torrents = (await pAll(
		providers.map(scraper => () => new scraper(item, rigorous).getTorrents())
	)).flat()

	torrents = _.uniqWith(torrents, (from, to) => {
		if (to.hash != from.hash) {
			return false
		}
		to.providers = _.uniq(to.providers.concat(from.providers))
		to.slugs = _.uniq(to.slugs.concat(from.slugs))
		!to.bytes && from.bytes && (to.bytes = from.bytes)
		!to.stamp && from.stamp && (to.stamp = from.stamp)
		!to.seeders && from.seeders && (to.seeders = from.seeders)
		!to.score && from.score && (to.score = from.score)
		return true
	})

	let cached = await debrid.getCached(torrents.map(v => v.hash))
	torrents.forEach((v, i) => (v.cached = cached[i]))

	torrents.sort((a, b) => b.bytes - a.bytes)

	return torrents
}

export interface Scraper {
	getResults(slug: string, sort: string): Promise<Result[]>
}
export class Scraper {
	sorts = ['']
	concurrency = 1

	get slugs() {
		let slugs = [] as string[]
		if (this.item.movie) {
			slugs.push(`${this.item.movie.title} ${this.item.movie.year}`)
			if (this.rigorous && this.item.movie.belongs_to_collection) {
				let collection = this.item.movie.belongs_to_collection.name.split(' ')
				slugs.push(collection.slice(0, -1).join(' '))
			}
		}
		if (this.item.show) {
			let title = this.item.show.title
			if ((!this.item.S.n && !this.item.E.n) || this.rigorous) {
				slugs.push(title)
			}
			if (this.item.S.n) {
				slugs.push(`${title} s${this.item.S.z}`)
				this.rigorous && slugs.push(`${title} season ${this.item.S.n}`)
			}
			this.item.E.n && slugs.push(`${title} s${this.item.S.z}e${this.item.E.z}`)
		}
		return slugs.map(v => utils.toSlug(v))
	}

	constructor(public item: media.Item, public rigorous = false) {}

	async getTorrents() {
		let combinations = [] as Parameters<typeof Scraper.prototype.getResults>[]
		let sorts = this.rigorous ? this.sorts : [this.sorts[0]]
		this.slugs.forEach(slug => sorts.forEach(sort => combinations.push([slug, sort])))

		/** get results with slug and sorts query combinations */
		let results = (await pAll(
			combinations.map(([slug, sort]) => async () =>
				(await this.getResults(slug, sort)).map(result => ({
					providers: [this.constructor.name],
					slugs: [slug],
					...result,
				}))
			),
			{ concurrency: this.concurrency }
		)).flat() as Result[]

		/** remove junk results */
		_.remove(results, result => {
			/** clean and check for magnet URL */
			result.magnet = utils.clean(result.magnet)
			let magnet = (qs.parseUrl(result.magnet).query as any) as MagnetQuery
			if (!magnet.xt) {
				console.warn(`junk !magnet.xt ->`, result)
				return true
			}

			/** check and repair name then slugify */
			result.name = result.name || magnet.dn
			if (!result.name) {
				console.warn(`junk !result.name ->`, result)
				return true
			}
			result.name = utils.toSlug(result.name, { toName: true, separator: '.' })

			if (utils.accuracy(this.item.title, result.name).length > 0) {
				// console.warn(`junk accuracy > 0 ->`, result)
				return true
			}
		})

		/** accumulate seeders and determine min and max range */
		let seeders = results.map(v => v.seeders)
		let range = { min: _.min(seeders), max: _.max(seeders) }
		results.forEach(result => {
			/** set score to a number between 1-100 based on seeders min and max */
			result.score = _.round(utils.slider(result.seeders, range.min, range.max))
		})

		return results.map(v => new torrent.Torrent(v))
	}
}

export interface Result {
	bytes: number
	magnet: string
	name: string
	providers: string[]
	score: number
	seeders: number
	slugs: string[]
	stamp: number
}

export interface MagnetQuery {
	dn: string
	tr: string[]
	xt: string
}