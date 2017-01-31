'use strict';

var exports = module.exports = {};

exports.shuffle = function(array) {
	var i = 0;
    var j = 0;
    var temp = null;

	for (i = array.length - 1; i > 0; i -= 1) {
		j = Math.floor(Math.random() * (i + 1));
		temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
}

exports.whoHas3D = function(hands) {
	for(var i=0; i<13; i++) {
		if(hands[0][i]==1) {
			return 0;
		} else if(hands[1][i]==1) {
			return 1;
		} else if(hands[2][i]==1) {
			return 2;
		} else if(hands[3][i]==1) {
			return 3;
		}
	}
}



function setDiff(arr1,arr2) {
	//returns set difference of two arrays.
	var out = [];
	for(var i=0; i<arr1.length; i++) {
		var c=0;
		for(var j=0; j<arr2.length; j++) {
			if(arr1[i]==arr2[j]) {
				c++; break;
			}
		}
		if(c==0) out.push(arr1[i]);
	}
	return out;
}

exports.setDiff = setDiff;

function isPair(hand) { //takes an array and returns 0 if not a pair, 1 if a pair.
	if(hand.length != 2) return 0;
	if(Math.ceil(hand[0]/4)==Math.ceil(hand[1]/4)) {
		return 1;
	} else {
		return 0;
	}
}

exports.isPair = isPair;

function isThreeOfAKind(hand) {//returns 0 if not 3 of a kind or 1 if it is.
	if(hand.length != 3) return 0;
	if(Math.ceil(hand[0]/4)==Math.ceil(hand[1]/4) && Math.ceil(hand[0]/4) == Math.ceil(hand[2]/4)) {
		return 1;
	} else {
		return 0;
	}
}

exports.isThreeOfAKind = isThreeOfAKind;

function isFourOfAKind(hand) {//returns 0 if not 3 of a kind or 1 if it is.
	if(hand.length != 4) return 0;
	if(Math.ceil(hand[0]/4)==Math.ceil(hand[1]/4) && Math.ceil(hand[0]/4) == Math.ceil(hand[2]/4) && Math.ceil(hand[0]/4)==Math.ceil(hand[3]/4)) {
		return 1;
	} else {
		return 0;
	}
}

exports.isFourOfAKind = isFourOfAKind;

function isTwoPair(hand) {
	if(hand.length != 4) return 0;
	hand.sort(sortNumber);
	if(Math.ceil(hand[0]/4)==Math.ceil(hand[1]/4) && Math.ceil(hand[2]/4)==Math.ceil(hand[3]/4) && !isFourOfAKind(hand)) {
		return 1;
	} else {
		return 0;
	}
}

exports.isTwoPair = isTwoPair;

function isStraightFlush(hand) {
	if(hand.length != 5) return 0;
	hand.sort(sortNumber);
	if(hand[0]+4==hand[1] && hand[1]+4==hand[2] && hand[2]+4==hand[3] && hand[3]+4 == hand[4]) {
		return 1;
	} else {
		return 0;
	}
}

exports.isStraightFlush = isStraightFlush;

function isStraight(hand) {
	if(hand.length != 5) return 0;
	hand.sort(sortNumber);
	if(Math.ceil(hand[0]/4)+1==Math.ceil(hand[1]/4) && Math.ceil(hand[1]/4)+1==Math.ceil(hand[2]/4) && Math.ceil(hand[2]/4)+1==Math.ceil(hand[3]/4) && Math.ceil(hand[3]/4)+1==Math.ceil(hand[4]/4) && !isStraightFlush(hand)) {
		return 1;
	} else {
		return 0;
	}
}

exports.isStraight = isStraight;

function isFlush(hand) {
	if(hand.length != 5) return 0;
	if(hand[0] % 4 == hand[1] % 4 && hand[0] % 4 == hand[2] % 4 && hand[0] % 4 == hand[3] % 4 && hand[0] % 4 == hand[4] % 4) {
		return 1;
	} else {
		return 0;
	}
}

exports.isFlush = isFlush;

function isFullHouse(hand) { //returns 0 if not full house. 1 if fullhouse with smaller value being the 3 cards, 2 if fullhouse with larger value being the 3 cards.
	if(hand.length != 5) return 0;
	hand.sort(sortNumber);
	if(Math.ceil(hand[0]/4)==Math.ceil(hand[1]/4) && Math.ceil(hand[0]/4)==Math.ceil(hand[2]/4) && Math.ceil(hand[3]/4)==Math.ceil(hand[4]/4)) {
		return 1;
	} else if(Math.ceil(hand[0]/4)==Math.ceil(hand[1]/4) && Math.ceil(hand[2]/4)==Math.ceil(hand[3]/4) && Math.ceil(hand[2]/4) == Math.ceil(hand[4]/4)) {
		return 2;
	}
}

exports.isFullHouse = isFullHouse;

function isRealHand(hand) {
	if(hand.length>5 || hand.length==0) return 0;
	if(hand.length==1) return 1;
	if(hand.length==2 && isPair(hand)) return 1;
	if(hand.length==3 && isThreeOfAKind(hand)) return 1;
	if(hand.length==4 && (isFourOfAKind(hand) || isTwoPair(hand))) return 1;
	if(hand.length==5 && (isStraight(hand) || isFlush(hand) || isFullHouse(hand) || isStraightFlush(hand))) return 1;
	return 0;
}

exports.isRealHand = isRealHand;

function sortNumber(a,b) {
    return a - b;
}

function validatePlayedHand(hand, prevHand, control) {
	if(!isRealHand(hand)) return 0;
		if(control==1) {
			return 1; //as long as hand is real it can be played.
		} else {
			hand = hand.sort(sortNumber);
			prevHand = prevHand.sort(sortNumber);
			if(hand.length != prevHand.length) {
				return 0;
			} else {
				if(hand.length == 1) { //one card played
					if(hand[0] > prevHand[0]) {
						return 1;
					} else {
						return 0;
					}
				} else if(hand.length == 2) { //two card hands
					if(isPair(hand)) {
						if(hand[1] > prevHand[1]) {
							return 1;
						} else {
							return 0;
						}
					} else {
						return 0;
					}
				} else if(hand.length == 3) { //three card hand
					if(isThreeOfAKind(hand)) {
						if(hand[2] > prevHand[2]) {
							return 1;
						} else {
							return 0;
						}
					} else {
						return 0;
					}
				} else if(hand.length == 4) { //four card hand
					if(isFourOfAKind(hand)) {
						if(!isFourOfAKind(prevHand)) {
							return 1;
						} else {
							if(hand[3] > prevHand[3]) {
								return 1;
							} else {
								return 0;
							}
						}
					} else if(isTwoPair(hand)) {
						if(isFourOfAKind(prevHand)) {
							return 0;
						} else {
							if(hand[3] > prevHand[3]) {
								return 1;
							} else {
								return 0;
							}
						}
					} else {
						return 0;
					}
				} else {//is 5 card hand 
					if(isStraightFlush(hand)) {
						if(!isStraightFlush(prevHand)) {
							return 1;
						} else { //two straight flushes
							if(hand[4] > prevHand[4]) {
								return 1;
							} else {
								return 0;
							}
						}							
					} else if(isFullHouse(hand)) {
						if(isStraightFlush(prevHand)) {
							return 0;
						} else if(isFullHouse(prevHand)) {
							var maxH, maxPrev;
							if(isFullHouse(hand)==1) {
								maxH = hand[0];
							} else {
								maxH = hand[4];
							}
							
							if(isFullHouse(prevHand)==1) {
								maxPrev = prevHand[0];
							} else {
								maxPrev = prevHand[4];
							}
							if(maxH > maxPrev) {
								return 1;
							} else {
								return 0;
							}							
						} else {
							return 1;
						}
					} else if(isFlush(hand)) {
						if(isStraightFlush(prevHand) || isFullHouse(prevHand)) {
							return 0;
						} else if(isFlush(prevHand)) {
							if(hand[4] > prevHand[4]) {
								return 1;
							} else {
								return 0;
							}
						} else {
							return 1;
						}
					} else if(isStraight(hand)) {
						if(isStraightFlush(prevHand) || isFullHouse(prevHand) || isFlush(prevHand)) {
							return 0;
						} else if(isStraight(prevHand)) {
							if(hand[4] > prevHand[4]) {
								return 1;
							} else {
								return 0;
							}
						} else {
							return 1;
						}
					}
				}
			}
		}
}
			
exports.validatePlayedHand = validatePlayedHand;



//very very basic AI
function simpleAIdecision(currentHand, prevHand, control) {
	currentHand.sort(sortNumber);
	//first identify what (more than single card) hands we possess. Not especially efficient but should be quick enough.
	var twoCardHands = []; var threeCardHands = []; var fourCardHands = []; var fiveCardHands = [];
	for(var i=0; i<(currentHand.length-1); i++) {
		if(Math.ceil(currentHand[i]/4)==Math.ceil(currentHand[i+1]/4)) {
			twoCardHands.push([currentHand[i],currentHand[i+1]]);
		}
	}
	
	//three card hands.
	for(var i=0; i<(currentHand.length-2); i++) {
		if(Math.ceil(currentHand[i]/4)==Math.ceil(currentHand[i+1]/4)&&Math.ceil(currentHand[i]/4)==Math.ceil(currentHand[i+2]/4)) {
			threeCardHands.push([currentHand[i],currentHand[i+1],currentHand[i+2]]);
		}
	}
	
	//four card hands we can get from combinations of two card hands.
	for(var i=0; i<(twoCardHands.length-1); i++) {
		for(var j=(i+1); j<twoCardHands.length; j++) {
			var temp = twoCardHands[i].concat(twoCardHands[j]);
			//need to check all elements are unique.
			var count = 0;
			for(var k=0; k<(temp.length-1); k++) {
				for(var y=(k+1); y<temp.length; y++) {
					if(temp[k]==temp[y]) count++;
				}
			}
			if(count==0) fourCardHands.push(temp);
		}
	}
	
	//five card hands.
	//can form full houses from combinations of two card and three card hands.
	for(var i=0; i<twoCardHands.length; i++) {
		for(var j=0; j<threeCardHands.length; j++) {
			var temp = twoCardHands[i].concat(threeCardHands[j]);
			//need to check all elements are unique.
			var count = 0;
			for(var k=0; k<(temp.length-1); k++) {
				for(var y=(k+1); y<temp.length; y++) {
					if(temp[k]==temp[y]) count++;
				}
			}
			if(count==0) fiveCardHands.push(temp);
		}
	}
	//now look for flushes.
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
	if(diamonds.length>=5) {
		fiveCardHands.push(diamonds.slice(0,4).concat(diamonds[diamonds.length-1])); //only add one flush to play. Lowest 4 cards and highest.
	}
	if(clubs.length>=5) {
		fiveCardHands.push(clubs.slice(0,4).concat(clubs[clubs.length-1]));
	}
	if(hearts.length>=5) {
		fiveCardHands.push(hearts.slice(0,4).concat(hearts[hearts.length-1]));
	}
	if(spades.length>=5) {
		fiveCardHands.push(spades.slice(0,4).concat(spades[spades.length-1]));
	}
	
	//now looking for straights.
	for(var i=0; i<(currentHand.length-4); i++) {
		var temp = []; temp.push(currentHand[i]);
		var sn = Math.ceil(currentHand[i]/4); var count = 1;
		for(var j=(i+1); j<currentHand.length; j++) {
			if(Math.ceil(currentHand[j]/4)==(sn+1)) {
				count++; sn++; temp.push(currentHand[j]);
			}
		}
		if(count>=5) {
			fiveCardHands.push(temp.slice(temp.length-5,temp.length));
		}
	}//may lead to double inclusions but doesn't really matter.
	
	//if the AI has control, it plays a hand of the highest number of cards it can
		
	if(control) {
		var n, rn;
		n = fiveCardHands.length;
		if(n>0) {
			rn = Math.floor(n*Math.random());
			return fiveCardHands[rn];
		} else {
			n = fourCardHands.length;
			if(n>0) {
				rn = Math.floor(n*Math.random());
				return fourCardHands[rn];
			} else {
				n = threeCardHands.length;
				if(n>0) {
					rn = Math.floor(n*Math.random());
					return threeCardHands[rn];
				} else {
					n = twoCardHands.length;
					if(n>0) {
						rn = Math.floor(n*Math.random());
						return twoCardHands[rn];
					} else {
						n = currentHand.length;
						rn = Math.floor(n*Math.random());
						return [currentHand[rn]];
					}
				}
			}
		}
	} else {
		//not in control.
		//try and play the lowest hand you can.
		if(prevHand.length==1) {
			if(currentHand[currentHand.length-1] < prevHand[0]) return 0; //i.e. pass
			for(var i=0; i<currentHand.length; i++) {
				if(currentHand[i] > prevHand[0]) {
					return [currentHand[i]];
				}
			}
		} else if(prevHand.length==2) {
			for(var i=0; i<twoCardHands.length; i++) {
				if(validatePlayedHand(twoCardHands[i],prevHand,0)) return twoCardHands[i];
			} 
			return 0;
		} else if(prevHand.length==3) {
			for(var i=0; i<threeCardHands.length;i++) {
				if(validatePlayedHand(threeCardHands[i],prevHand,0)) return threeCardHands[i];
			}
			return 0;
		} else if(prevHand.length==4) {
			for(var i=0; i<fourCardHands.length;i++) {
				if(validatePlayedHand(fourCardHands[i],prevHand,0)) return fourCardHands[i];
			}
			return 0;
		} else {
			for(var i=0; i<fiveCardHands.length; i++) {
				if(validatePlayedHand(fiveCardHands[i],prevHand,0)) return fiveCardHands[i];
			}
			return 0;
		}
	}
	
}

exports.simpleAI = simpleAIdecision;
