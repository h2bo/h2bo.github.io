//var connection = new WebSocket('wss://server.saltyrtc.org:443'); 
var connection = new WebSocket('wss://obscure-sierra-55073.herokuapp.com');
var name = ""; 
 
var loginInput = document.querySelector('#loginInput'); 
var loginBtn = document.querySelector('#loginBtn'); 
var otherUsernameInput = document.querySelector('#otherUsernameInput'); 
var connectToOtherUsernameBtn = document.querySelector('#connectToOtherUsernameBtn'); 
var callPage = document.querySelector('#callPage');
var loginPage = document.querySelector('#loginPage');
var videoPage = document.querySelector('#videoPage');
var myVideo = document.querySelector('#myVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var yourName = document.querySelector('#userLogin');
var statusText = document.querySelector('#status');

var connectedUser, myConnection, theStream;
  
const constraints = window.constraints = {
  audio: false,
  video: true
};  
  
  
//const servers = {'iceServers': [{'urls': 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'}]};
  
  
  
  
//when a user clicks the login button 
loginBtn.addEventListener("click", function(event){ 

   name = loginInput.value; 
	
   if(name.length > 0){ 
      send({ 
         type: "login", 
         name: name 
      }); 
   }
   
   callPage.style.display = "inline";
   loginPage.style.display = "none";
   userLogin.innerHTML = loginInput.value;
	
});




//setup a peer connection with another user 
connectToOtherUsernameBtn.addEventListener("click", function () {
  
	console.log("The call button was clicked");
	callPage.style.display = "none";
	videoPage.style.display = "inline";
	
	//initVideo();
  
  
   var otherUsername = otherUsernameInput.value;
   connectedUser = otherUsername;
	
   if (otherUsername.length > 0) { 
      //make an offer 
      myConnection.createOffer(function (offer) { 
         console.log(); 
			
         send({ 
            type: "offer", 
            offer: offer 
         }); 
			
         myConnection.setLocalDescription(offer); 
		 console.log(myConnection);
      }, function (error) { 
         alert("An error has occurred."); 
      }); 
   } 
});

async function initVideo(){
	
	var stream1 = await navigator.mediaDevices.getUserMedia(constraints);
	showOwnVideo(stream1);
}
  
  
function showOwnVideo(stream) {
  const video = myVideo;
  
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;
}
  

function showRemoteVideo(stream) {
	//todo... when the other user shows their video
}
  
  
  
  
  
//handle messages from the server 
connection.onmessage = function (message) { 
   //console.log("Got message", message.data);
   
   try{
		var data = JSON.parse(message.data); 
	
		switch(data.type) { 
		case "login": 
			onLogin(data.success); 
			break; 
		case "offer": 
			onOffer(data.offer, data.name); 
			break; 
		case "answer": 
			onAnswer(data.answer); 
			break; 
		case "candidate": 
			onCandidate(data.candidate); 
			break; 
		default: 
			break; 
		}
   }
   catch(error){
	   //console.log("Got something not JSON");
   };
};









//when a user logs in 
function onLogin(success) { 

   if (success === false) { 
      alert("oops...try a different username"); 
   } else { 
      //creating our RTCPeerConnection object 
		
      //********************** 
      //Starting a peer connection 
      //********************** 
		
      //getting local video stream 
      navigator.getUserMedia({ video: true, audio: false }, function (myStream) { 
         theStream = myStream; 
			
         //displaying local video stream on the page 
         myVideo.srcObject = theStream;
			
         //using Google public stun server 
         var configuration = { 
            "iceServers": 
			[
				{'urls': 'stun:stun1.l.google.com:19302'}, 
				{'urls': 'stun:stun2.l.google.com:19302'},
				{'urls': 'stun:stun3.l.google.com:19302'}, 
				{'urls': 'stun:stun4.l.google.com:19302'},
				{'urls': 'turn:3.13.58.4:3478?transport=tcp', username: "dude", credential: "dude"}
			]
         }; 
			
         myConnection = new RTCPeerConnection(configuration); 
			
         // setup stream listening 
         myConnection.addStream(theStream); 
			
         //when a remote user adds stream to the peer connection, we display it 
         myConnection.onaddstream = function (e) { 
            remoteVideo.srcObject = e.stream;
         };
			
         // Setup ice handling 
         myConnection.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         };  
			
      }, function (error) { 
         console.log(error); 
      }); 
   } 
};
  
  
  
  
  
  
  
connection.onopen = function () { 
   console.log("Connected to the signalling server"); 
   statusText.innerHTML = "Connected to the signalling server!";
};
  
  
  
  
  
  
connection.onerror = function (err) { 
   console.log("Got error", err); 
};
  
  
  
  
  
// Alias for sending messages in JSON format 
function send(message) { 

   if (connectedUser) { 
      message.name = connectedUser; 
   } 
	
   connection.send(JSON.stringify(message)); 
};













  
//when somebody wants to call us 
function onOffer(offer, name) { 
   connectedUser = name; 
   myConnection.setRemoteDescription(new RTCSessionDescription(offer));
	
   myConnection.createAnswer(function (answer) { 
      myConnection.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("oops...error"); 
   }); 
   
   console.log("Got an Offer from " + name);
}




//when another user answers to our offer 
function onAnswer(answer) { 
   myConnection.setRemoteDescription(new RTCSessionDescription(answer)); 
   console.log("Got an Answer");
}
  
  
  
  
//when we got ice candidate from another user 
function onCandidate(candidate) { 
   myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
   console.log("Got an ICE Candidate");
}
















//creating data channel 
function openDataChannel() { 

   var dataChannelOptions = { 
      reliable:true 
   }; 
	
   dataChannel = myConnection.createDataChannel("myDataChannel", dataChannelOptions);
	
   dataChannel.onerror = function (error) { 
      console.log("Error:", error); 
   };
	
   dataChannel.onmessage = function (event) { 
      console.log("Got message:", event.data); 
   };  
}