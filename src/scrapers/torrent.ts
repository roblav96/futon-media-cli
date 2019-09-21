import * as _ from 'lodash'
import * as dayjs from 'dayjs'
import * as debrids from '@/debrids/debrids'
import * as qs from '@/shims/query-string'
import * as scraper from '@/scrapers/scraper'
import * as trackers from '@/scrapers/trackers'
import * as utils from '@/utils/utils'

export interface Torrent extends scraper.Result {}
export class Torrent {
	hash: string
	packs = 0
	cached = [] as debrids.Debrids[]

	get age() {
		return dayjs(this.stamp).fromNow()
	}
	get date() {
		return dayjs(this.stamp).format('MMM DD YYYY')
	}
	get size() {
		return utils.fromBytes(this.bytes)
	}

	boost = 1
	boosts(episodes?: number) {
		let bytes = this.bytes
		if (_.isFinite(episodes)) {
			if (this.packs > 0) bytes = this.bytes / (episodes * this.packs)
		} else if (this.packs > 1) {
			bytes = this.bytes / this.packs
		}
		return {
			bytes: _.ceil(bytes * this.boost),
			seeders: _.ceil(this.seeders * this.boost * this.providers.length),
		}
	}

	get short() {
		let flags = { R: 'R 🇫🇷', P: 'P 🇧🇪' }
		let boost = `[${this.boost.toFixed(2)} x${this.packs > 0 ? ` ${this.packs}` : ''}]`
		return `${boost} [${this.size}] [${this.seeders}] ${
			this.cached.length > 0 ? `[${this.cached.map(v => flags[v[0].toUpperCase()])}] ` : ''
		}${this.name} [${this.age}] [${this.providers.length + ' x ' + this.providers}]`
	}
	get json() {
		let magnet = (qs.parseUrl(this.magnet).query as any) as scraper.MagnetQuery
		let minify = qs.stringify(
			{ xt: magnet.xt, dn: magnet.dn.replace(/\s+/g, '+') },
			{ encode: false, sort: false }
		)
		return utils.compact({
			age: this.age,
			boost: this.boost,
			cached: this.cached.join(', '),
			magnet: `magnet:?${minify}`,
			name: this.name,
			packs: this.packs,
			providers: this.providers.join(', '),
			seeders: this.seeders,
			size: this.size,
		})
	}

	constructor(result: scraper.Result) {
		let magnet = (qs.parseUrl(result.magnet).query as any) as scraper.MagnetQuery
		magnet.xt = magnet.xt.toLowerCase()
		magnet.dn = result.name
		magnet.tr = trackers.TRACKERS
		result.magnet = `magnet:?${qs.stringify(
			{ xt: magnet.xt, dn: magnet.dn, tr: magnet.tr },
			{ encode: false, sort: false }
		)}`
		_.merge(this, result)
		this.hash = magnet.xt.split(':').pop()
	}
}
