'use strict';

var config 	= require('../config');
var redis 	= require('redis').createClient;
var adapter = require('socket.io-redis');

var game = require('../gameLogic');
var Room = require('../models/room');
var User = require('../models/user');

var gameTimers = [];

/**
 * Encapsulates all code for emitting and listening to socket events (server side)
 *
 */
var ioEvents = function(io) {

	// Rooms namespace
	io.of('/rooms').on('connection', function(socket) {

		// Create a new room
		socket.on('createRoom', function(title) {
			Room.findOne({'title': new RegExp('^' + title + '$', 'i')}, function(err, room){
				if(err) throw err;
				if(room){
					socket.emit('updateRoomsList', { error: 'Room title already exists.' });
				} else {
					Room.create({ 
						title: title
					}, function(err, newRoom){
						if(err) throw err;
						socket.emit('updateRoomsList', newRoom);
						socket.broadcast.emit('updateRoomsList', newRoom);
					});
				}
			});
		});
	});

	// Chatroom namespace
	io.of('/chatroom').on('connection', function(socket) {

		// Join a chatroom
		socket.on('join', function(roomId) {
			Room.findById(roomId, function(err, room){
				if(err) throw err;
				if(!room){
					// Assuming that you already checked in router that chatroom exists
					// Then, if a room doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
				} else {
					// Check if user exists in the session
					if(socket.request.session.passport == null){
						return;
					}
					socket.emit('updateSeats',room);
					Room.addUser(room, socket, function(err, newRoom){

						// Join the room channel
						socket.join(newRoom.id);

						Room.getUsers(newRoom, socket, function(err, users, cuntUserInRoom){
							if(err) throw err;
							
							// Return list of all user connected to the room to the current user
							socket.emit('updateUsersList', users, true);

							// Return the current user to other connecting sockets in the room 
							// ONLY if the user wasn't connected already to the current room
							if(cuntUserInRoom === 1){
								socket.broadcast.to(newRoom.id).emit('updateUsersList', users[users.length - 1]);
							}
						});
					});
				}
			});
		});
		
		function updateTimer(room, socket) {
			
			var roomId = room.id;
			clearTimeout(gameTimers[room.id]);
			gameTimers[room.id] = setTimeout(function() {
				var plyrsGo = room.plyrsGo;
				if(room.control==1) {
					var handToPlay = [room.hands[plyrsGo][0]];
					var remainHand = game.setDiff(room.hands[plyrsGo],handToPlay);
					room.prevHand = handToPlay;
					room.hands[plyrsGo] = remainHand;
					room.control = 0;
					room.passCounter = 0;
					room.markModified('hands');
					room.markModified('prevHand');
					room.markModified('control');
					socket.emit('showHandJustPlayed',handToPlay);
					socket.broadcast.to(roomId).emit('showHandJustPlayed',handToPlay);
					socket.emit('updateHand',remainHand);
					var num = [room.hands[0].length, room.hands[1].length, room.hands[2].length, room.hands[3].length];
					socket.emit('updateOppHands',num);
					socket.broadcast.to(roomId).emit('updateOppHands',num);
					if(room.hands[plyrsGo].length==0) {
						room.gameState = 0;
						socket.emit('userError',"game finished!");
						socket.broadcast.to(roomId).emit('userError',"game finished!");
						room.markModified('gameState');
					}
				} else {
					if(room.passCounter == 2) {
						room.control = 1;
						room.markModified('control');
						room.passCounter = 0;
					} else {
						room.passCounter = room.passCounter + 1;
					}
				}
				if(plyrsGo==3) {
					room.plyrsGo=0;
				} else {
					room.plyrsGo=plyrsGo + 1;
				}
				room.markModified('plyrsGo');
				room.markModified('passCounter');
				room.modified = new Date();
				room.save(function(err) {
					if(err) throw err;
				});
				socket.emit('updateGo',room.plyrsGo, room.control);
				socket.broadcast.to(roomId).emit('updateGo',room.plyrsGo, room.control);
				plyrsGo = room.plyrsGo;
				if(room.usersSeated[plyrsGo].userId=="computer") {
					clearTimeout(gameTimers[roomId]);
					AIgo(room,socket);
				} else {
					updateTimer(room,socket);
				}
			},room.gameTimer);
			
		}
		
		function AIgo(room, socket) {
			//Room.findById(roomId, function(err,room) {
				//if(err) throw err;
				var plyrGo = room.plyrsGo;
				setTimeout(function() {
					var AIdec = game.simpleAI(room.hands[plyrGo],room.prevHand,room.control);
					if(AIdec==0) {//passes
						if(room.passCounter == 2) {
							room.control = 1;
							room.passCounter = 0;
						} else {
							room.passCounter += 1;
						}
					} else { //AI chooses a hand to play
						room.prevHand = AIdec;
						room.hands[plyrGo] = game.setDiff(room.hands[plyrGo],AIdec);
						room.control = 0;
						room.passCounter = 0;
					}
					
					if(room.hands[plyrGo].length==0) { // AI wins. should really write a function for this.
						socket.emit('showHandJustPlayed',AIdec);
						socket.broadcast.to(roomId).emit('showHandJustPlayed',AIdec);
						var num = [room.hands[0].length, room.hands[1].length, room.hands[2].length, room.hands[3].length];
						socket.emit('updateOppHands',num);
						socket.broadcast.to(roomId).emit('updateOppHands',num);
						socket.emit('userError',"game finished!");
						socket.broadcast.to(roomId).emit('userError',"game finished!");
						room.gameState = 0;
						room.markModified('gameState');
						room.markModified('hands');
						room.markModified('prevHand');
						room.modified = new Date();
						room.save(function(err) {
							if(err) throw err;
						});
					} else {
						if(plyrGo==3) {
							room.plyrsGo = 0;
						} else {
							room.plyrsGo = plyrGo+1;
						}
						room.markModified('passCounter');
						room.markModified('plyrsGo');
						room.markModified('hands');
						room.markModified('prevHand');
						room.markModified('control');
						room.markModified('passCounter');
						room.modified = new Date();
						room.save(function(err) {
							if(err) throw err;
						});
						var roomId = room.id;
						if(AIdec != 0) {//AI didn't pass so need to update things
							socket.emit('showHandJustPlayed',AIdec);
							socket.broadcast.to(roomId).emit('showHandJustPlayed',AIdec);
							var num = [room.hands[0].length, room.hands[1].length, room.hands[2].length, room.hands[3].length];
							socket.emit('updateOppHands',num);
							socket.broadcast.to(roomId).emit('updateOppHands',num);
						}
						socket.emit('updateGo',room.plyrsGo, room.control);
						socket.broadcast.to(roomId).emit('updateGo',room.plyrsGo, room.control);
						if(AIdec!=0) {
							socket.emit('gameMessage',"Player " + (plyrGo+1) + " just played. It is now player " + (room.plyrsGo+1) +"'s go!");
							socket.broadcast.to(roomId).emit('gameMessage',"Player " + (plyrGo+1) + "just played. It is now player " + (room.plyrsGo+1) +"'s go!");
						} else {
							socket.emit('gameMessage',"Player " + (plyrGo+1) + " passes. It is now player " + (room.plyrsGo+1) +"'s go!");
							socket.broadcast.to(roomId).emit('gameMessage',"Player " + (plyrGo+1) + "passes. It is now player " + (room.plyrsGo+1) +"'s go!");
						}					
						
						plyrGo = room.plyrsGo;
						if(room.usersSeated[plyrGo].userId=="computer") {
							AIgo(room,socket);
						} else {
							updateTimer(room,socket);
						}
					}
					
				},2500);
			//});
		}
		
		socket.on('updateGameTimer', function(roomId, time) {
			if(time < 10) {
				socket.emit('userError',"Turn length must be at least 10 seconds");
			} else {
				Room.findById(roomId, function(err,room) {
				if(err) throw err;
				if(!room){
					// Assuming that you already checked in router that chatroom exists
					// Then, if a room doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
				}
				
				var userId = socket.request.session.passport.user;
				//check if this is host sending request.
				if(room.usersSeated[0].userId != userId) {
					socket.emit('userError',"Only host can change the turn length!");
				} else {
					if(room.gameState==1) {
						socket.emit('userError', "Cannot update turn length during a game!");
					} else {
						room.gameTimer = time*1000;
						room.markModified('gameTimer');
						room.modified = new Date();
						room.save(function(err) {
							if(err) throw err;
						});
						socket.emit('updateGameTimer',time*1000);
						socket.broadcast.to(roomId).emit('updateGameTimer',time*1000);
						socket.emit('userError',"Successfully updated");
					}
				}
				
				
				});
			}
		});
		
		socket.on('newGame', function(roomId) {
			Room.findById(roomId, function(err,room) {
				if(err) throw err;
				if(!room){
					// Assuming that you already checked in router that chatroom exists
					// Then, if a room doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
				}
				//check if user is already seated.
				var userId = socket.request.session.passport.user;
				
				//first check if this is the host requesting a new game.
				if(room.usersSeated[0].userId != userId) {
					socket.emit('userError', "Only the host can start a new game");
				} else {
					//check if the game is already in progress
					if(room.gameState == 1) {
						socket.emit('userError',"Game is already in progress!");
					} else {
						//check if 4 players are seated
						if(room.usersSeated[0] == null || room.usersSeated[1] == null || room.usersSeated[2] == null || room.usersSeated[3]==null) {
							socket.emit('userError',"There must be 4 players seated to begin a game!");
						} else {
							//shuffle and deal out deck.
							socket.emit('clearPrev');
							socket.broadcast.to(roomId).emit('clearPrev');
							var deck = [];
							for(var i=0; i<52; i++) deck[i] = (i+1);
							game.shuffle(deck);
							room.hands[0]=[];
							room.hands[1]=[];
							room.hands[2]=[];
							room.hands[3]=[];
							for(var i=0; i<13; i++) {
								room.hands[0].push(deck[i]);
								room.hands[1].push(deck[i+13]);
								room.hands[2].push(deck[i+26]);
								room.hands[3].push(deck[i+39]);
							}
							room.gameState = 1; //game is now started.
							var firstMove = game.whoHas3D(room.hands);
							room.hands[firstMove] = game.setDiff(room.hands[firstMove],[1]); //remove 3D from their hand.
							var whoseGo;
							if(firstMove==3) {
								whoseGo=0;
							} else {
								whoseGo = firstMove+1;
							}
							room.plyrsGo = whoseGo;
							room.prevHand = [1]; //3 of diamonds
							
							//save in db
							room.markModified('plyrsGo');
							room.markModified('hands');
							room.markModified('prevHand');
							room.modified = new Date();
							room.save(function(err) {
								if(err) throw err;
							});
							
							var numCards = [room.hands[0].length, room.hands[1].length, room.hands[2].length, room.hands[3].length];
							//show previous hand (i.e. 3D).
							socket.emit('showHandJustPlayed', [1]);
							socket.broadcast.to(roomId).emit('showHandJustPlayed',[1]);
							//show whose go it is & emit message
							socket.emit('updateGo',whoseGo,0);
							socket.emit('gameMessage',"Player "+(firstMove+1)+" starts with the 3 of diamonds. It is now player " + (whoseGo+1) +"'s turn!");
							socket.broadcast.to(roomId).emit('updateGo',whoseGo,0);
							socket.broadcast.to(roomId).emit('gameMessage',"Player "+(firstMove+1)+" starts with the 3 of diamonds. It is now player " + (whoseGo+1) +"'s turn!");
							//send signal to show opponents hands.
							socket.emit('updateOppHands',numCards);
							socket.broadcast.to(roomId).emit('updateOppHands',numCards);
							//send players their hands.
							socket.emit('updateHand',room.hands[0]);
							for(var i=1; i<4; i++) {
								var sockID = room.usersSeated[i].socketId;
								socket.broadcast.to(sockID).emit('updateHand',room.hands[i]);
							}
							//check if next player is an AI, if so make them play.
							if(room.usersSeated[whoseGo].userId == "computer") {
								AIgo(room,socket);
							} else {
								updateTimer(room,socket);
							}
						}
					}
				}
			});
		});
		
		socket.on('kickPlayer', function(roomId, seatNum) {
			Room.findById(roomId, function(err,room) {
				if(err) throw err;
				if(!room){
					// Assuming that you already checked in router that chatroom exists
					// Then, if a room doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
				}
				//check if user is already seated.
				var userId = socket.request.session.passport.user;
				if(room.usersSeated[0].userId == userId) {
					if(seatNum > 0 && seatNum < 4) {
						if(room.gameState==1) {
							socket.emit('userError',"Cannot kick a player when a game is in progress!");
						} else {
							if(room.usersSeated[seatNum]==null) {
								socket.emit('userError',"Noone to kick!");
							} else {
								var kickUserId = room.usersSeated[seatNum].userId;
								if(room.usersSeated[seatNum].socketId != "computer") {
									var sockToLeave =room.usersSeated[seatNum].socketId;
									socket.broadcast.to(sockToLeave).emit('userError',"Host has kicked you from the game.");
								}
								room.usersSeated[seatNum] = null;
								room.markModified('usersSeated');
								room.modified = new Date();
								room.save(function(err) {
									if(err) throw err;
								});
								socket.emit('updateSeats',room);
								socket.broadcast.to(roomId).emit('updateSeats',room);
								//broadcast to host his extra options
								if(socket.id == room.usersSeated[0].socketId) {
									//this is host
									socket.emit('showHostOptions',room);
								}
								if(room.usersSeated[0]!=null) {//host exists
									var sockID = room.usersSeated[0].socketId;
									socket.broadcast.to(sockID).emit('showHostOptions',room);
								}
							}
						}
					}
				} else {
					socket.emit('userError',"Only the host can kick a player!");
				}
				
			});
		});
		
		socket.on('addAI', function(roomId, seatNum) {
			//check if user exists in the session.
			if(socket.request.session.passport == null) {
				socket.emit('userError',"Not Logged in!");
				return;
			}
			
			//find the room. Check if user is already seated/ if the seat is free. If so, add user to seat and save.
			Room.findById(roomId, function(err, room) {
				if(err) throw err;
				if(!room){
					// Assuming that you already checked in router that chatroom exists
					// Then, if a room doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
				}
				//check if user is already seated.
				var userId = socket.request.session.passport.user;
				
					if(room.usersSeated[0].userId != userId) {
						socket.emit('userError',"Only the host can add an AI player");
					} else {
						//check that seat is free.
						if(room.usersSeated[seatNum] == null) {
							
							var seated = {userId: "computer", socketId: "computer", username: "<b>Computer</b>", level: 1};
							room.usersSeated[seatNum] = seated;
							room.modified = new Date();
							room.save(function(err) {
								if(err) throw err;
							});
							socket.emit('updateSeats',room);
							socket.broadcast.to(roomId).emit('updateSeats',room);
							//broadcast to host his extra options
							if(socket.id == room.usersSeated[0].socketId) {
									//this is host
									socket.emit('showHostOptions',room);
							}
						
							
						} else {
							socket.emit('userError',"Seat is not free!");
						}					
					}
				});
		});

		socket.on('seatRequest', function(roomId, seatNum) {
			
			//check if user exists in the session.
			if(socket.request.session.passport == null) {
				socket.emit('userError',"Not Logged in!");
				return;
			}
			
			//find the room. Check if user is already seated/ if the seat is free. If so, add user to seat and save.
			Room.findById(roomId, function(err, room) {
				if(err) throw err;
				if(!room){
					// Assuming that you already checked in router that chatroom exists
					// Then, if a room doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
				}
				//check if user is already seated.
				var userId = socket.request.session.passport.user;
				for(var i=0; i<4; i++) {
					if(room.usersSeated[i] == null) {
						continue;
					} else {
						if(room.usersSeated[i].userId == userId) {
							socket.emit('userError',"You are already sat in this game!");
							return;
						}
					}
				}
				//check if seat is free
				if(room.usersSeated[seatNum]==null) {
					
					User.findById(userId, function(err, user) {
						if(err) throw err;
						var seating = {userId: userId, socketId: socket.id, username: user.username, level: user.level};
						room.usersSeated[seatNum] = seating;
						room.modified = new Date();
						room.save(function(err) {
							if(err) throw err;
						});
						socket.emit('updateSeats',room);
						socket.broadcast.to(roomId).emit('updateSeats',room);
						//broadcast to host his extra options
						if(socket.id == room.usersSeated[0].socketId) {
								//this is host
								socket.emit('showHostOptions',room);
						}
						if(room.usersSeated[0]!=null) {//host exists
							var sockID = room.usersSeated[0].socketId;
							socket.broadcast.to(sockID).emit('showHostOptions',room);
						}
					});
					
				} else {
					socket.emit('userError',"Seat is already taken!");
				}
				
			});
		});
		
		socket.on('pass', function(roomId) {
			Room.findById(roomId, function(err,room) {
				if(err) throw err;
				if(!room){
					// Assuming that you already checked in router that chatroom exists
					// Then, if a room doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
				}
				//check if user is already seated.
				var userId = socket.request.session.passport.user;
				var plyrGo = room.plyrsGo;
				if(room.gameState==1) {
					if(room.usersSeated[plyrGo].userId != userId) {
						socket.emit('userError',"It is not your turn!");
					} else {
						if(room.passCounter==2) {
							room.passCounter = 0;
							room.control = 1;
						} else {
							room.passCounter += 1;
						}
						if(plyrGo==3) {
							room.plyrsGo = 0;
						} else {
							room.plyrsGo = plyrGo + 1;
						}
						//update room
						room.markModified('plyrsGo');
						room.markModified('hands');
						room.markModified('prevHand');
						room.markModified('control');
						room.markModified('passCounter');
						room.modified = new Date();
						room.save(function(err) {
							if(err) throw err;
						});
						socket.emit('updateGo',room.plyrsGo,room.control);
						socket.broadcast.to(roomId).emit('updateGo',room.plyrsGo,room.control);
						socket.emit('gameMessage',"Player " + (plyrGo+1) + " passes. It is now player " + (room.plyrsGo+1) +"'s go!");
						socket.broadcast.to(roomId).emit('gameMessage',"Player " + (plyrGo+1) + "passes. It is now player " + (room.plyrsGo+1) +"'s go!");
						plyrGo = room.plyrsGo;
						if(room.usersSeated[plyrGo].userId == "computer") {
							clearTimeout(gameTimers[room.id]);
							AIgo(room,socket);						
						} else {
							updateTimer(room,socket);
						}
						
					}
				}
			});
		});
		
		socket.on('handPlayed', function(hand, roomId) {
			Room.findById(roomId, function(err,room) {
				if(err) throw err;
				if(!room){
					// Assuming that you already checked in router that chatroom exists
					// Then, if a room doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
				}
				//check if user is already seated.
				var userId = socket.request.session.passport.user;
				var plyrGo = room.plyrsGo;
				if(room.usersSeated[plyrGo].userId != userId) {
					socket.emit('userError',"It is not your turn!");
				} else {
					//check if hand submitted is actually in the hand it should be.
					var remainHand = game.setDiff(room.hands[plyrGo],hand);
					if(room.hands[plyrGo].length - remainHand.length != hand.length) {
						socket.emit('userError', "You do not have that hand to submit!");
					} else {
						if(game.isRealHand(hand)) {
							var cont = room.control;
							if(game.validatePlayedHand(hand,room.prevHand,cont)) {
								
								room.prevHand = hand;
								room.control = 0;
								room.hands[plyrGo] = remainHand;
								if(room.hands[plyrGo].length==0) { //player has won
									socket.emit('showHandJustPlayed',hand);
									socket.broadcast.to(roomId).emit('showHandJustPlayed',hand);
									socket.emit('updateHand',remainHand);
									var num = [room.hands[0].length, room.hands[1].length, room.hands[2].length, room.hands[3].length];
									socket.emit('updateOppHands',num);
									socket.broadcast.to(roomId).emit('updateOppHands',num);
									socket.emit('userError',"game finished!");
									socket.broadcast.to(roomId).emit('userError',"game finished!");
									room.gameState = 0;
									room.markModified('gameState');
									room.markModified('hands');
									room.markModified('prevHand');
									room.modified = new Date();
									room.save(function(err) {
										if(err) throw err;
									});
								} else {
									if(plyrGo==3) {
										room.plyrsGo = 0;
									} else {
										room.plyrsGo = plyrGo+1;
									}
									room.passCounter = 0;
									room.markModified('plyrsGo');
									room.markModified('passCounter');
									room.markModified('hands');
									room.markModified('prevHand');
									room.markModified('control');
									room.modified = new Date();
									room.save(function(err) {
										if(err) throw err;
									});
									//display necessary updates client side.
									socket.emit('showHandJustPlayed',hand);
									socket.broadcast.to(roomId).emit('showHandJustPlayed',hand);
									socket.emit('updateHand',remainHand);
									var num = [room.hands[0].length, room.hands[1].length, room.hands[2].length, room.hands[3].length];
									socket.emit('updateOppHands',num);
									socket.broadcast.to(roomId).emit('updateOppHands',num);
									socket.emit('updateGo',room.plyrsGo,room.control);
									socket.broadcast.to(roomId).emit('updateGo',room.plyrsGo,room.control);
									socket.emit('gameMessage',"Player " + (plyrGo+1) + " just played. It is now player " + (room.plyrsGo+1) +"'s go!");
									socket.broadcast.to(roomId).emit('gameMessage',"Player " + (plyrGo+1) + "just played. It is now player " + (room.plyrsGo+1) +"'s go!");
									plyrGo = room.plyrsGo;
									//if next player(s) is AI, they must take their turns. Would be nice to have a function that handles this really but whatever.
									if(room.usersSeated[plyrGo].userId == "computer") {
										clearTimeout(gameTimers[room.id]);
										AIgo(room,socket);
									} else {
										updateTimer(room,socket);
									}
								}
								
							} else {
								socket.emit('userError', "Cannot play this hand at the moment!");
							}
						} else {
							socket.emit('userError',"This is not a real hand!");
						}
					}
				}
				
			});
		});
		
		// When a socket exits
		socket.on('disconnect', function() {

			// Check if user exists in the session
			if(socket.request.session.passport == null){
				return;
			}

			// Find the room to which the socket is connected to, 
			// and remove the current user + socket from this room
			Room.removeUser(socket, function(err, room, userId, cuntUserInRoom){
				if(err) throw err;
				//if no one is left (or just computers), delete the room.
				if((room.usersSeated[0]==null || room.usersSeated[0].userId=="computer") && (room.usersSeated[1]==null || room.usersSeated[1].userId=="computer") && (room.usersSeated[2]==null || room.usersSeated[2].userId=="computer")&&(room.usersSeated[3]==null || room.usersSeated[3].userId=="computer")) {
					gameTimers[room.id] = null;
					room.remove();
					
				}
				// Leave the room channel
				socket.leave(room.id);

				// Return the user id ONLY if the user was connected to the current room using one socket
				// The user id will be then used to remove the user from users list on chatroom page
				if(cuntUserInRoom === 1){
					socket.broadcast.to(room.id).emit('removeUser', userId);
					//remove user from seat (if they are seated)
					socket.broadcast.to(room.id).emit('updateSeats', room);
				}
			});
		});
		
		

		// When a new message arrives
		socket.on('newMessage', function(roomId, message) {

			// No need to emit 'addMessage' to the current socket
			// As the new message will be added manually in 'main.js' file
			// socket.emit('addMessage', message);
			
			socket.broadcast.to(roomId).emit('addMessage', message);
		});

	});
}

/**
 * Initialize Socket.io
 * Uses Redis as Adapter for Socket.io
 *
 */
var init = function(app){

	var server 	= require('http').Server(app);
	var io 		= require('socket.io')(server);

	// Force Socket.io to ONLY use "websockets"; No Long Polling.
	io.set('transports', ['websocket']);

	// Using Redis
	let port = config.redis.port;
	let host = config.redis.host;
	let password = config.redis.password;
	let pubClient = redis(port, host, { auth_pass: password });
	let subClient = redis(port, host, { auth_pass: password, return_buffers: true, });
	io.adapter(adapter({ pubClient, subClient }));

	// Allow sockets to access session data
	io.use((socket, next) => {
		require('../session')(socket.request, {}, next);
	});

	// Define all Events
	ioEvents(io);

	// The server object will be then used to list to a port number
	return server;
}

module.exports = init;