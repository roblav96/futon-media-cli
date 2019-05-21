import * as _ from 'lodash'
import * as debrids from '@/debrids/debrids'
import * as emby from '@/emby/emby'
import * as media from '@/media/media'
import * as pAll from 'p-all'
import * as pQueue from 'p-queue'
import * as Rx from '@/shims/rxjs'
import * as scraper from '@/scrapers/scraper'
import * as torrent from '@/scrapers/torrent'
import * as trakt from '@/adapters/trakt'
import * as utils from '@/utils/utils'
import * as realdebrid from '@/debrids/realdebrid'

process.nextTick(() => {
	let rxFavorite = emby.rxHttp.pipe(
		Rx.op.filter(({ method, parts }) => method == 'POST' && parts.includes('favoriteitems')),
		Rx.op.map(({ query }) => ({ ItemId: query.ItemId, UserId: query.UserId }))
	)
	rxFavorite.subscribe(async ({ ItemId, UserId }) => {
		let Session = await emby.sessions.byUserId(UserId)
		if (!emby.Session.HDUsers.includes(Session.UserName.toLowerCase())) return

		let Item = await emby.library.byItemId(ItemId)
		if (!Item || !['Movie', 'Series', 'Episode'].includes(Item.Type)) return

		let actives = (await realdebrid.client.get(
			'/torrents/activeCount'
		)) as realdebrid.ActiveCount
		if (actives.nb >= _.ceil(actives.limit * 0.8)) {
			throw new Error(`RealDebrid actives ${actives.nb} >= ${actives.limit}`)
		}

		let item = await emby.library.item(Item.Path, Item.Type)

		if (Item.Type == 'Movie') {
			queue.add(() => download(item))
		}

		if (Item.Type == 'Series') {
			let seasons = (await trakt.client.get(
				`/shows/${item.traktId}/seasons`
			)) as trakt.Season[]
			seasons = seasons.filter(v => v.number > 0 && v.aired_episodes > 0)
			queue.addAll(
				seasons.map(season => () => download(item.use({ type: 'season', season })))
			)
		}

		if (Item.Type == 'Episode') {
			let { ParentIndexNumber: s, IndexNumber: e } = Item
			let episode = (await trakt.client.get(
				`/shows/${item.traktId}/seasons/${s}/episodes/${e}`
			)) as trakt.Episode
			queue.add(() => download(item.use({ type: 'episode', episode })))
		}
	})
})

let queue = new pQueue({ concurrency: 1 })
async function download(item: media.Item) {
	console.warn(`download ->`, item.title, `${item.S.z}${item.E.z}`)
	let torrents = await scraper.scrapeAll(item)
	// console.log(`all torrents ->`, torrents.map(v => v.json))
	let index = torrents.findIndex(({ cached }) => cached.length > 0)
	if (index == -1) return console.warn(`download index == -1`)
	console.log(`best cached ->`, torrents[index].json)
	torrents = torrents.slice(0, index)
	torrents = torrents.filter(({ seeders }) => seeders > 1)
	if (!process.DEVELOPMENT) console.log(`download torrents ->`, torrents.length)
	else console.log(`download torrents ->`, torrents.length, torrents.map(v => v.json))
	if (torrents.length > 0) debrids.download(torrents)
}