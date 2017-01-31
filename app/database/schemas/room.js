'use strict';

var Mongoose  = require('mongoose');
var Schema = Mongoose.Schema;
var Mixed = Schema.Types.Mixed;

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
var RoomSchema = new Mongoose.Schema({
    title: { type: String, required: true },
    connections: { type: [{ userId: String, socketId: String }]},
	gameState: { type: Number, default: 0},
	hands: { type: Mixed, default: []},
	prevHand: { type: Mixed, default: []},
	usersSeated: { type: [{ userId: String, socketId: String, username: String, level: Number }]},
	plyrsGo: {type: Number, default: 0},
	control: {type: Number, default: 0},
	passCounter: {type: Number, default: 0},
	gameTimer: {type: Number, default: 60000}
	
});

var roomModel = Mongoose.model('room', RoomSchema);

module.exports = roomModel;