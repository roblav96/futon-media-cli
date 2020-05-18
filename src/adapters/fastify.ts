import * as cors from 'fastify-cors'
import * as Fastify from 'fastify'
import * as mem from 'mem'
import * as multipart from 'fastify-multipart'
import * as qs from 'query-string'
import exitHook = require('exit-hook')

export default mem((port: string) => {
	let fastify = Fastify({ querystringParser: (query) => qs.parse(query) })
	// fastify.register(cors)
	// fastify.register(multipart)
	fastify.server.headersTimeout = 60000
	fastify.server.keepAliveTimeout = 30000
	fastify.server.timeout = 60000
	fastify.listen(port).then(
		(address) => {
			console.info(`fastify listen ->`, address)
			exitHook(() => fastify.close())
		},
		(error) => console.error(`fastify listen '${port}' -> %O`, error),
	)
	return fastify
})
