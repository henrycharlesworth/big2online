'use strict';

//variables used for displaying game state
var currentHand = []; //players current hand.
var selectedHand = [];
var plyrsGo = 0;
var sortInd = 0; //sort either by suit or number
var numCards = [13,13,13,13]; //number of cards for p1,p2,p3,p4.
if(document.getElementById("main-stage")!=null) {
	var canvasWidth = document.getElementById("main-stage").width;
	var canvasHeight = document.getElementById("main-stage").height;
	var ctx = document.getElementById("main-stage").getContext("2d");
}
var prevHands = [[],[],[]]; //display the previous 3 hands.

//properties for displaying back of cards.
var backCardWidth = 61;
var backCardHeight = 87;
var backCardShift = 20;
var backTopP1 = 95; var backLeftP1 = 500;
var backTopP3 = 523; var backLeftP3 = 500;
var backTopP2 = 185; var backLeftP2 = 1003;
var backTopP4 = 185; var backLeftP4 = 220;
var backOfCard = new Image();
backOfCard.src = "/img/cards/back.jpg";
//properties for cards in hand/ previous hand display.
var cardWidth = 144; var cardHeight = 208;
var cardShift = 50;
var selectShift = 20; //how much card is shifted when selected.
var handHeight = 720; // height of where current hand is displayed
var handL = 250;
var prevHeight = 230; var prevL = 500; var prevHShift = 50; var prevVShift = 40;
var prevCardWidth = 101; var prevCardHeight = 146;
var timer;
var cTime; var maxTime = 60000;

//drawing functions

//draw back of cards (showing number of cards each opponent has).
function drawBackCards() {
	ctx.clearRect(0,0,canvasWidth,canvasHeight);
	var p1t = backTopP1; var p1l = backLeftP1;
	var p2t = backTopP2; var p2l = backLeftP2;
	var p3t = backTopP3; var p3l = backLeftP3;
	var p4t = backTopP4; var p4l = backLeftP4;
	//for P1
	for(var i=0; i<numCards[0]; i++) {
		ctx.drawImage(backOfCard,p1l,p1t,backCardWidth,backCardHeight);
		p1l += backCardShift;
	}
	//for P2
	for(var i=0; i<numCards[1]; i++) {
		ctx.save();
		ctx.translate(p2l + backCardWidth/2, p2t + backCardHeight/2);
		ctx.rotate(Math.PI/2);
		ctx.translate(-p2l - backCardWidth/2, -p2t - backCardHeight/2);
		ctx.drawImage(backOfCard,p2l,p2t,backCardWidth,backCardHeight);
		ctx.restore();
		p2t += backCardShift;
	}
	//for P3
	for(var i=0; i<numCards[2]; i++) {
		ctx.drawImage(backOfCard,p3l,p3t,backCardWidth,backCardHeight);
		p3l += backCardShift;
	}
	//for P4
	for(var i=0; i<numCards[3]; i++) {
		ctx.save();
		ctx.translate(p4l + backCardWidth/2, p4t + backCardHeight/2);
		ctx.rotate(Math.PI/2);
		ctx.translate(-p4l - backCardWidth/2, -p4t - backCardHeight/2);
		ctx.drawImage(backOfCard,p4l,p4t,backCardWidth,backCardHeight);
		ctx.restore();
		p4t += backCardShift;
	}
}


function sortNumber(a,b) {
    return a - b;
}

//draw current hand

function drawCurrentHand() {
	if (sortInd==1) {
		currentHand.sort(sortNumber);
	} else if (sortInd == -1) {
		//sort by suits
		var diamonds = [];
		var clubs = [];
		var hearts = [];
		var spades = [];
		for(var i=0; i<currentHand.length; i++) {
			if(currentHand[i] % 4 == 1) { //then diamond.
				diamonds.push(currentHand[i]);
			} else if(currentHand[i] % 4 == 2) { //then club.
				clubs.push(currentHand[i]);
			} else if(currentHand[i] % 4 == 3) { //then heart.
				hearts.push(currentHand[i]);
			} else {
				spades.push(currentHand[i]);
			}
		}
		currentHand = diamonds.concat(clubs,hearts,spades);
	}	
	
	for(var i=0; i<currentHand.length; i++) {
		var cardId = "pc"+(i+1);
		var card = document.getElementById(cardId);
		card.innerHTML = ("<img src='/img/cards/"+String(currentHand[i])+".png'  width='"+String(cardWidth)+"' height='"+String(cardHeight)+"'/>");
		card.style.left = String(handL + i*cardShift)+"px";
		card.style.visibility = "visible";
		card.style.zIndex = String(i);
		var selected = 0;
		for(var j=0; j<selectedHand.length; j++) {
			if(currentHand[i] == selectedHand[j]) {
				selected = 1;
				break;
			}
		}
		if(selected) {
			card.style.top = String(handHeight - selectShift) + "px";
		} else {
			card.style.top = String(handHeight) + "px";
		}
	}
	
	for(var i=currentHand.length; i<13; i++) {
		var cardId = "pc"+(i+1);
		var card = document.getElementById(cardId);
		card.style.visibility = "hidden";
	}
	
	card = document.getElementById("sortButton");
	card.style.visibility = "visible";
	card = document.getElementById("submitHand");
	card.style.visibility = "visible";
	card = document.getElementById("passGo");
	card.style.visibility = "visible";
}

//make it so it is clear which cards are selected in a hand.
function selectCard(n) {
	var alreadyThere = 0; var index = 0;
	for(var i=0; i<selectedHand.length; i++) {
		if(currentHand[n-1] == selectedHand[i]) {
			alreadyThere=1;
			index = i;
		}
	}
	
	if(alreadyThere) { //remove
		selectedHand.splice(index,1);
	} else {
		selectedHand.push(currentHand[n-1]);
	}
	drawCurrentHand();
}

//draw previously played hands.

function drawPreviousHands() {
	var zIndCounter = 1;
	//draw 3 prev hands
	for(var j=0; j<3; j++) {
		for(var i=0; i<prevHands[j].length; i++) {
			var cardId = "prev"+(j+1)+(i+1);
			var card = document.getElementById(cardId);
			card.innerHTML = ("<img src='/img/cards/"+String(prevHands[j][i])+".png' width='"+String(prevCardWidth)+"' height='"+String(prevCardHeight)+"'/>");
			card.style.width = String(cardWidth)+"px";
			card.style.height = String(cardHeight) + "px";
			card.style.left = String(prevL + i*prevHShift)+"px";
			card.style.top = String(prevHeight + j*prevVShift) + "px";
			card.style.visibility = "visible";
			card.style.zIndex = zIndCounter;
			zIndCounter++;
		}
		for(var i=prevHands[j].length; i<5; i++) {
			var cardId = "prev" + (j+1) + (i+1);
			var card = document.getElementById(cardId);
			card.style.visibility = "hidden";
		}
	}

}
//provide a sorting function.

function sortHand() {
	if (sortInd==1) {
		sortInd *= -1;
		drawCurrentHand();
	} else if (sortInd == -1) {
		//sort by suits
		sortInd *= -1;
		drawCurrentHand();
	} else {
		sortInd =1;
		drawCurrentHand();
	}
		
}

//allow for reorganizing cards
function dragStart(ev) {
	ev.dataTransfer.effectAllowed='move';
	var cardid = ev.target.parentElement.id;
	var cardNum = cardid.match(/\d/g);
	cardNum = parseInt(cardNum.join(""));
	ev.dataTransfer.setData("c1",cardNum);
	ev.dataTransfer.setDragImage(ev.target,0,0);
	
	return true;
}

function dragEnter(ev) {
	ev.preventDefault();
}

function dragOver(ev) {
	return false;
}

function dragDrop(ev) {
	var c1 = ev.dataTransfer.getData("c1");
	var cardid = ev.target.parentElement.id;
	var cardNum = cardid.match(/\d/g);
	var c2 = parseInt(cardNum.join(""));
	var temp = currentHand[c1-1];
	currentHand[c1-1] = currentHand[c2-1];
	currentHand[c2-1] = temp;
	drawCurrentHand();
	ev.stopPropagation();
	sortInd = 0;
	return false;
}

//handling the main app functions (websocket messages client side).
var app = {

  rooms: function(){

    var socket = io('/rooms', { transports: ['websocket'] });

    // When socket connects, get a list of chatrooms
    socket.on('connect', function () {

      // Update rooms list upon emitting updateRoomsList event
      socket.on('updateRoomsList', function(room) {

        // Display an error message upon a user error(i.e. creating a room with an existing title)
        $('.room-create p.message').remove();
        if(room.error != null){
          $('.room-create').append(`<p class="message error">${room.error}</p>`);
        }else{
          app.helpers.updateRoomsList(room);
        }
      });

      // Whenever the user hits the create button, emit createRoom event.
      $('.room-create button').on('click', function(e) {
        var inputEle = $("input[name='title']");
        var roomTitle = inputEle.val().trim();
        if(roomTitle !== '') {
          socket.emit('createRoom', roomTitle);
          inputEle.val('');
        }
      });

    });
  },

  chat: function(roomId, username){
    
    var socket = io('/chatroom', { transports: ['websocket'] });

      // When socket connects, join the current chatroom
      socket.on('connect', function () {

        socket.emit('join', roomId);
		
        // Update users list upon emitting updateUsersList event
        socket.on('updateUsersList', function(users, clear) {

          $('.container p.message').remove();
          if(users.error != null){
            $('.container').html(`<p class="message error">${users.error}</p>`);
          }else{
            app.helpers.updateUsersList(users, clear);
          }
        });
		
		socket.on('updateOppHands',function(numberOfCards) {
			numCards = numberOfCards;
			drawBackCards();
		});
		
		socket.on('updateHand',function(cHand) {
			var newHand = [];
			var handIndex = 0;
			if(currentHand.length!=0) {
				for(var i=0; i<currentHand.length; i++) {
					//check if card still exists
					var isStillThere = 0;
					for(var j=0; j<cHand.length; j++) {
						if(currentHand[i]==cHand[j]) {
							newHand[handIndex] = currentHand[i];
							handIndex++;
							break;
						}
					}
				}
				currentHand = newHand;
			} else {
				currentHand = cHand;
			}
			drawCurrentHand();
		});
		
		socket.on('showHandJustPlayed',function(hand) {
			//update previous hands and draw them
			prevHands[0] = prevHands[1];
			prevHands[1] = prevHands[2];
			prevHands[2] = hand;
			drawPreviousHands();
		});
		
		//update users sat in the game.
		socket.on('updateSeats',function(room) {
			for(var i=0; i<4; i++) {
				var str = "p"+(i+1)+"details";
				var box = document.getElementById(str);
				if(room.usersSeated[i]==null) {
					str = "<div class='button' id='p"+(i+1)+"seatreq'>Sit</div>";
					box.innerHTML = (str);
				} else {
					str = room.usersSeated[i].username + "<br/>" + "Level: " + room.usersSeated[i].level;
					box.innerHTML = (str);
				}
			}
		});
		
		socket.on('updateGameTimer', function(tInmSecs) {
			maxTime = tInmSecs;
		});
		
		socket.on('updateGo',function(whoseGo, control) {
			clearInterval(timer);
			cTime = 0;
			for(var i=0; i<4; i++) {
				var string = "player"+(i+1);
				var pContainer = document.getElementById(string);
				if(i==whoseGo) {
					if(control) {
						pContainer.style.background = "#b3ffb3";
					} else {
						pContainer.style.background = "#ffffcc";
					}
					var goContainer = pContainer;
					timer = setInterval(function() {
						cTime += 50;
						var percent = 100*(cTime/maxTime);
						goContainer.style.backgroundImage = "-webkit-linear-gradient(left, #3366ff, #3366ff " + percent + "%, transparent " + percent + "%, transparent 100%)";
					},50);
				} else {
					pContainer.style.background = "#b3e6ff";
				}
			}
		});
		
		socket.on('gameMessage', function(message) {
			var messBox = document.getElementById("gameMessages");
			messBox.innerHTML = (message);
		});
		
		//add host "privileges"
		socket.on('showHostOptions', function(room) {
			var ngamebutton = document.getElementById("newGameButton");
			ngamebutton.style.visibility = "visible";
			ngamebutton = document.getElementById("gameTimeContainer");
			ngamebutton.style.visibility = "visible";
			for(var i=1; i<4; i++) {
				var str = "p" + (i+1)+"hostoptions";
				var box = document.getElementById(str);
				if(room.usersSeated[i]==null) {
					str = "<br/><div class='button' id='p"+(i+1)+"makeAI'>Computer Player</div>";
					box.innerHTML = (str);
				} else {
					str = "<br/><div class='button' id='p"+(i+1)+"kick'>Kick</div>";
					box.innerHTML = (str);
				}
			}
		});
		
		socket.on('clearPrev',function() {
			currentHand = [];
			prevHands = [[],[],[]];
			sortInd = 0;
		});
		
		//temporary handling of certain errors.
		socket.on('userError',function(error) {
			alert(error);
		});
		
		$('body').on('click','div#sortButton', function(e) {
			sortHand();
		});
		
		$('body').on('click','div#newGameButton', function(e) {
			socket.emit('newGame', roomId);
		});
		
		$('body').on('click','div#p1makeAI', function(e) {
			socket.emit('addAI',roomId, 0);
		});
		
		$('body').on('click','div#p2makeAI', function(e) {
			socket.emit('addAI',roomId, 1);
		});
		
		$('body').on('click','div#p3makeAI', function(e) {
			socket.emit('addAI',roomId, 2);
		});
		
		$('body').on('click','div#p4makeAI', function(e) {
			socket.emit('addAI',roomId, 3);
		});
		
		$('body').on('click','div#p2kick', function(e) {
			socket.emit('kickPlayer', roomId, 1);
		});
		
		$('body').on('click','div#p3kick', function(e) {
			socket.emit('kickPlayer', roomId, 2);
		});
		
		$('body').on('click','div#p4kick', function(e) {
			socket.emit('kickPlayer', roomId, 3);
		});
		
		$('body').on('click','div#p1seatreq', function(e) {
			socket.emit('seatRequest', roomId, 0);
		});
		
		$('body').on('click','div#p2seatreq', function(e) {
			socket.emit('seatRequest', roomId, 1);
		});
		
		$('body').on('click','div#p3seatreq', function(e) {
			socket.emit('seatRequest', roomId, 2);
		});
		
		$('body').on('click','div#p4seatreq', function(e) {
			socket.emit('seatRequest', roomId, 3);
		});
		
		$('body').on('click','div#submitHand',function(e) {
			socket.emit('handPlayed',selectedHand,roomId);
			selectedHand = [];
			drawCurrentHand();
		});
		
		$('body').on('click','div#passGo',function(e) {
			socket.emit('pass',roomId);
		});
		
		$('body').on('click','div#updateGameTime', function(e) {
			var x = document.getElementById("gameTime").value;
			var regex=/^[0-9]+$/;
			if(!x.match(regex)) {
				alert("Must input a number");
			} else {
				socket.emit('updateGameTimer',roomId, parseInt(x));
			}
		});
		
        // Whenever the user hits the save button, emit newMessage event.
        $(".chat-message button").on('click', function(e) {

          var textareaEle = $("textarea[name='message']");
          var messageContent = textareaEle.val().trim();
          if(messageContent !== '') {
            var message = { 
              content: messageContent, 
              username: username,
              date: Date.now()
            };

            socket.emit('newMessage', roomId, message);
            textareaEle.val('');
            app.helpers.addMessage(message);
          }
        });

        // Whenever a user leaves the current room, remove the user from users list
        socket.on('removeUser', function(userId) {
          $('li#user-' + userId).remove();
          app.helpers.updateNumOfUsers();
        });

        // Append a new message 
        socket.on('addMessage', function(message) {
          app.helpers.addMessage(message);
        });
      });
  },

  helpers: {

    encodeHTML: function (str){
      return $('<div />').text(str).html();
    },

    // Update rooms list
    updateRoomsList: function(room){
      room.title = this.encodeHTML(room.title);
      var html = `<a href="/chat/${room._id}"><li class="room-item">${room.title}</li></a>`;

      if(html === ''){ return; }

      if($(".room-list ul li").length > 0){
        $('.room-list ul').prepend(html);
      }else{
        $('.room-list ul').html('').html(html);
      }
      
      this.updateNumOfRooms();
    },

    // Update users list
    updateUsersList: function(users, clear){
        if(users.constructor !== Array){
          users = [users];
        }

        var html = '';
        for(var user of users) {
          user.username = this.encodeHTML(user.username);
          html += `<li class="clearfix" id="user-${user._id}">
                     <img src="${user.picture}" alt="${user.username}" />
                     <div class="about">
                        <div class="name">${user.username}</div>
                        <div class="status"><i class="fa fa-circle online"></i> online</div>
                     </div></li>`;
        }

        if(html === ''){ return; }

        if(clear != null && clear == true){
          $('.users-list ul').html('').html(html);
        }else{
          $('.users-list ul').prepend(html);
        }

        this.updateNumOfUsers();
    },

    // Adding a new message to chat history
    addMessage: function(message){
      message.date      = (new Date(message.date)).toLocaleString();
      message.username  = this.encodeHTML(message.username);
      message.content   = this.encodeHTML(message.content);

      var html = `<li>
                    <div class="message-data">
                      <span class="message-data-name">${message.username}</span>
                      <span class="message-data-time">${message.date}</span>
                    </div>
                    <div class="message my-message" dir="auto">${message.content}</div>
                  </li>`;
      $(html).hide().appendTo('.chat-history ul').slideDown(200);

      // Keep scroll bar down
      $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
    },

    // Update number of rooms
    // This method MUST be called after adding a new room
    updateNumOfRooms: function(){
      var num = $('.room-list ul li').length;
      $('.room-num-rooms').text(num +  " Room(s)");
    },

    // Update number of online users in the current room
    // This method MUST be called after adding, or removing list element(s)
    updateNumOfUsers: function(){
      var num = $('.users-list ul li').length;
      $('.chat-num-users').text(num +  " User(s)");
    }
}
};