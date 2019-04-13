import * as _ from 'lodash'
import * as memoize from 'mem'
import * as trakt from '@/adapters/trakt'
import * as tmdb from '@/adapters/tmdb'
import * as utils from '@/utils/utils'
import * as Memoize from '@/utils/memoize'

export const TYPES = ['movie', 'show', 'season', 'episode', 'person'] as ContentType[]

export interface Item extends trakt.Extras {}
@Memoize.Class
export class Item {
	movie: trakt.Movie & tmdb.Movie
	show: trakt.Show & tmdb.Show
	season: trakt.Season & tmdb.Season
	episode: trakt.Episode & tmdb.Episode
	person: trakt.Person & tmdb.Person

	get type() {
		return _.findLast(TYPES, type => !!this[type])
	}
	get full() {
		return _.merge({}, ...TYPES.map(v => this[v])) as Full
	}
	get main() {
		let main = this.full
		this.movie && (main = this.movie as any)
		this.show && (main = this.show as any)
		return main
	}
	get ids() {
		return this.main.ids
	}

	get title() {
		let title = this.main.title
		this.movie && (title += ` ${this.movie.year}`)
		return title
	}

	get popularity() {
		return this.score + this.main.votes
	}

	get S() {
		let n = this.season ? this.season.number : this.episode ? this.episode.season : NaN
		return _.isFinite(n) ? { n, z: utils.zeroSlug(n) } : {}
	}
	get E() {
		let n = this.episode ? this.episode.number : NaN
		return _.isFinite(n) ? { n, z: utils.zeroSlug(n) } : {}
	}

	constructor(result: PartialDeep<trakt.Result & tmdb.Result>) {
		this.use(result)
	}

	use(result: PartialDeep<trakt.Result & tmdb.Result>) {
		let picked = _.pick(result, TYPES)
		_.merge(this, picked)
		for (let [rkey, rvalue] of Object.entries(_.omit(result, TYPES))) {
			let ikey = trakt.RESULT_ITEM[rkey]
			if (ikey) {
				this[ikey] = rvalue
			}
		}
		Memoize.clear(this)
		return this
	}
}

export type ContentType = 'movie' | 'show' | 'season' | 'episode' | 'person'
export type ContentTypes = 'movies' | 'shows' | 'seasons' | 'episodes' | 'people'
export type Full = typeof Item.prototype.movie &
	typeof Item.prototype.show &
	typeof Item.prototype.season &
	typeof Item.prototype.episode &
	typeof Item.prototype.person