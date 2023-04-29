import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server, Socket } from 'socket.io'
import Maze from './maze'

import * as dotenv from 'dotenv'
dotenv.config()

const port: number = parseInt(process.env.PORT)

class App {
	private server: http.Server
	private port: number

	private io: Server
	private clients: any = {}

    private map: Maze

	constructor(port: number) {
		this.port = port
		const app = express()
		// app.use(express.static(path.join(__dirname, '../client')))

		// CORS setup
		app.use(
			cors({
				origin: '*',
			})
		)

        const rows = 11
        const cols = 11

        // Maze setup
        this.map = new Maze({
            rows,
            cols
        })

		// GET route for fetching the map
		app.get('/map', (req, res) => {
			res.send(JSON.stringify({
                map: this.map.getMatrix(),
                walkablePositions: this.map.getWalkablePositions(),
                entrance: this.map.getEntrance(),
                exit: this.map.getExit(),
                width: cols,
                height: rows
            }))
		})

		this.server = new http.Server(app)

		this.io = new Server(this.server, {
			cors: {
				origin: '*', // TODO: Change to proper origin
			},
		})

		this.io.on('connection', (socket: Socket) => {
			console.log(socket.constructor.name)
			this.clients[socket.id] = {}
			console.log(this.clients)
			console.log('a user connected : ' + socket.id)
			socket.emit('id', socket.id)

			socket.on('disconnect', () => {
				console.log('socket disconnected : ' + socket.id)
				if (this.clients && this.clients[socket.id]) {
					console.log('deleting ' + socket.id)
					delete this.clients[socket.id]
					this.io.emit('removeClient', socket.id)
				}
			})

			socket.on('update', (message: any) => {
				if (this.clients[socket.id]) {
					this.clients[socket.id].t = message.t //client timestamp
					this.clients[socket.id].p = message.p //position
				}
			})
		})

		setInterval(() => {
			this.io.emit('clients', this.clients)
		}, 50)
	}

	public Start() {
		this.server.listen(this.port, () => {
			console.log(`Server listening on port ${this.port}.`)
		})
	}
}

new App(port).Start()
