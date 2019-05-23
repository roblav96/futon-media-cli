import * as _ from 'lodash'
import * as deepmerge from 'deepmerge'
import * as emby from '@/emby/emby'

process.nextTick(() =>
	(async () => {
		let Users = await emby.users.get()
		for (let User of Users) {
			let DisplayPreferences = await User.getDisplayPreferences()
			_.merge(DisplayPreferences, emby.defaults.DisplayPreferences)
			await User.setDisplayPreferences(DisplayPreferences)
			_.merge(User.Configuration, emby.defaults.Configuration)
			await User.setConfiguration(User.Configuration)
			if (!User.Policy.IsAdministrator) {
				_.merge(User.Policy, emby.defaults.Policy)
				await User.setPolicy(User.Policy)
			}
		}
	})().catch(error => console.error(`usersSync -> %O`, error))
)
