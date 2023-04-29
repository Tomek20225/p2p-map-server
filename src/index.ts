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
    private scoreboard: any = {}

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

        const rows = 11
        const cols = 11

        // Maze setup
        this.map = new Maze({
            rows,
            cols
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

			this.clients[socket.id] = {}
			this.scoreboard[socket.id] = 0

            socket.emit('map', this.getParsedMapObject())
			socket.emit('id', socket.id)

            socket.on('disconnect', () => {
				console.log('socket disconnected : ' + socket.id)
				if (this.clients && this.clients[socket.id] && this.scoreboard && this.scoreboard[socket.id]) {
					console.log('deleting ' + socket.id)
					delete this.clients[socket.id]
					delete this.scoreboard[socket.id]
					this.io.emit('removeClient', socket.id)
				}
			})

			socket.on('update', (message: any) => {
				if (this.clients[socket.id]) {
					this.clients[socket.id].t = message.t // client timestamp
					this.clients[socket.id].p = message.p // position
				}
			})
		})

        // Updating positions of players
		setInterval(() => {
			this.io.emit('clients', this.clients)
        }, 50)

        // Checking for the winner
        setInterval(() => {
            const exitPos = this.map.getExit()

            for (const clientId of Object.keys(this.clients)) {
                if (!this.clients[clientId].p) continue

                const clientX = Math.round(this.clients[clientId].p.x)
                const clientY = Math.round(this.clients[clientId].p.y)

                if (clientX == exitPos.x && clientY == exitPos.y) {
                    this.io.emit('winner', clientId)
                    console.log(`winner ${clientId}`)

                    this.scoreboard[clientId]++

                    this.map = new Maze({
                        rows,
                        cols
                    })

                    this.io.emit('map', this.getParsedMapObject())
                    this.io.emit('scoreboard', this.scoreboard)

                    break
                }
            }
        }, 100)

        setInterval(() => {
            this.io.emit('scoreboard', this.scoreboard)
        }, 1000)
    }

	public Start() {
		this.server.listen(this.port, () => {
			console.log(`Server listening on port ${this.port}.`)
		})
	}

    private getParsedMapObject() {
        return {
            map: this.map.getMatrix(),
            walkablePositions: this.map.getWalkablePositions(),
            entrance: this.map.getEntrance(),
            exit: this.map.getExit(),
            width: this.map.getWidth(),
            height: this.map.getHeight()
        }
    }
}

new App(port).Start()
