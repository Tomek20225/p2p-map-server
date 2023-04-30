import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server, Socket } from 'socket.io'
import Maze from './maze'

import * as dotenv from 'dotenv'
dotenv.config()

const port: number = parseInt(process.env.PORT)

type Clients = {
	[id: string]: Client
}

type Scoreboard = {
	[id: string]: number
}

type Client = {
	t: number
	p: {
		x: number
		y: number
		z: number
	}
}

class App {
	private server: http.Server
	private port: number

	private io: Server
	private clients: Clients = {}
	private scoreboard: Scoreboard = {}

	private map: Maze

	constructor(port: number) {
		this.port = port
		const app = express()

		// CORS setup
		app.use(
			cors({
				origin: '*',
			})
		)

		const defaultRows = 11
		const defaultCols = 11
		const scaleFactor = 3

		// Maze setup
		this.map = new Maze({
			rows: defaultRows,
			cols: defaultCols,
		})

		this.server = new http.Server(app)

		this.io = new Server(this.server, {
			cors: {
				origin: '*', // TODO: Change to proper origin
			},
		})

		this.io.on('connection', (socket: Socket) => {
			console.log(socket.constructor.name)
			console.log(this.clients)
			console.log('a user connected : ' + socket.id)

			this.clients[socket.id] = {} as Client
			this.scoreboard[socket.id] = 0

			socket.emit('map', this.getParsedMapObject())
			socket.emit('id', socket.id)

			socket.on('disconnect', () => {
				console.log('socket disconnected : ' + socket.id)
				console.log('deleting ' + socket.id)

				delete this.clients[socket.id]
				delete this.scoreboard[socket.id]

				this.io.emit('removeClient', socket.id)
				this.io.emit('scoreboard', this.scoreboard)
			})

			socket.on('update', (message: any) => {
				if (this.clients[socket.id]) {
					this.clients[socket.id].t = message.t // client timestamp
					this.clients[socket.id].p = message.p // position
				}
			})

			this.io.emit('scoreboard', this.scoreboard)
		})

		// Updating positions of players
		setInterval(() => {
			this.io.emit('clients', this.clients)
		}, 50)

		// Updating scores of players
		setInterval(() => {
			this.io.emit('scoreboard', this.scoreboard)
		}, 1000)

		// Checking for the winner
		setInterval(() => {
			const exitPos = this.map.getExit()

			for (const clientId of Object.keys(this.clients)) {
				if (!this.clients[clientId].p) continue

				const clientX = Math.round(this.clients[clientId].p.x)
				const clientY = Math.round(this.clients[clientId].p.y)

				if (!(clientX == exitPos.x && clientY == exitPos.y)) continue

				this.io.emit('winner', clientId)
				console.log(`winner ${clientId}`)

				this.scoreboard[clientId]++

				const clientAmount = Object.keys(this.clients).length
				let scaledRows = clientAmount * scaleFactor + Math.round(Math.random() * 4)
				let scaledCols = clientAmount * scaleFactor + Math.round(Math.random() * 4)
				scaledRows = scaledRows % 2 == 0 ? scaledRows + 1 : scaledRows
				scaledCols = scaledCols % 2 == 0 ? scaledCols + 1 : scaledCols

				this.map = new Maze({
					rows: scaledRows > defaultRows ? scaledRows : defaultRows,
					cols: scaledCols > defaultCols ? scaledCols : defaultCols,
				})

				this.io.emit('map', this.getParsedMapObject())
				this.io.emit('scoreboard', this.scoreboard)

				break
			}
		}, 100)
	}

	public Start() {
		this.server.listen(this.port, () => {
			console.log(`Server listening on port ${this.port}`)
		})
	}

	private getParsedMapObject() {
		return {
			map: this.map.getMatrix(),
			walkablePositions: this.map.getWalkablePositions(),
			entrance: this.map.getEntrance(),
			exit: this.map.getExit(),
			width: this.map.getWidth(),
			height: this.map.getHeight(),
		}
	}
}

new App(port).Start()
