var connection = new WebSocket('wss://obscure-sierra-55073.herokuapp.com'); //NECESSARY.  This is my custom signal server
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
var videosContainer = document.querySelector('#videosContainer');
var remoteVideosContainer = document.querySelector('#remoteVideosContainer');
var primaryVid = document.querySelector('#primaryVid');
var prevVideo = document.querySelector('#prevVideo');
var nextVideo = document.querySelector('#nextVideo');

var connectedUser, myConnection, theStream;

var qtyReceivedTracks = 0;
var receivedVideoTracks = [];
var receivedAudioTrack;
var currentPlayingVideo = 0;
var ms;
var myAudioDevice;

nextVideo.addEventListener("click", function()
{
	var allVidTracks = ms.getVideoTracks();	
	ms.removeTrack(allVidTracks[0]);
	
	currentPlayingVideo++;
	if(currentPlayingVideo >= qtyReceivedTracks)
		currentPlayingVideo = 0;
	
	ms.addTrack(receivedVideoTracks[currentPlayingVideo]);
});

prevVideo.addEventListener("click", function()
{
	var allVidTracks = ms.getVideoTracks();	
	ms.removeTrack(allVidTracks[0]);
	
	currentPlayingVideo--;
	if(currentPlayingVideo < 0)
		currentPlayingVideo = (qtyReceivedTracks - 1);
	
	ms.addTrack(receivedVideoTracks[currentPlayingVideo]);
});

function initPrimaryVideo()
{
	ms = new MediaStream();
	
	try{
	ms.addTrack(receivedVideoTracks[0]);
	ms.addTrack(receivedAudioTrack);
	
	primaryVid.srcObject = ms;
	primaryVid.play();
	}
	catch(e){
		console.log(e);
	}
}




function receiveVideo(e){
	console.log(e);
	
	if(e.track.kind === "audio")
	{
		receivedAudioTrack = e.track;
		
	}
	else
	{
		receivedVideoTracks[qtyReceivedTracks] = e.track;
		qtyReceivedTracks++;
	}
	
	document.querySelector('#connectStatus').style= "display: none";
	initPrimaryVideo();
}








//when a user logs in 
async function onLogin(success) { 

   if (success === false) { 
      alert("oops...try a different username"); 
   } 
   
   else 
   { 
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
		
		myConnection.addEventListener("track", e => receiveVideo(e), false);
		//myConnection.ontrack = (e) => receiveVideo(e);

         // Setup ice handling 
         myConnection.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         };
		 
		const audioStream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: {exact: myAudioDevice.deviceId}}});
		for(const track of audioStream.getTracks())
		{
			myConnection.addTrack(track);
		}
		
   } 
};















  
  
  
  
  
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
  
connection.onopen = function () { 
   console.log("Connected to the signalling server"); 
   statusText.innerHTML = "Connected to the signalling server!";
   DoViewerLogin();
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



function DoViewerLogin()
{
	const proxy = new URLSearchParams(window.location.search);
	
	name = proxy.get('vid');
	
   if(name.length > 0){ 
      send({ 
         type: "login", 
         name: name 
      }); 
   }
   
   console.log("Now waiting for video stream");
   statusText.innerHTML = "Connected to the signalling server, and waiting for a stream.  Please wait....";
}

/*
//setup a peer connection with another user 
connectToOtherUsernameBtn.addEventListener("click", function () {
  
	console.log("The call button was clicked");
	callPage.style.display = "none";
	videoPage.style.display = "inline";
	
   var otherUsername = otherUsernameInput.value;
   connectedUser = otherUsername;
	
   if (otherUsername.length > 0) { 
      //make an offer 
      myConnection.createOffer(function (offer) { 
			
         send({ 
            type: "offer", 
            offer: offer 
         }); 
			
         myConnection.setLocalDescription(offer);
      }, function (error) { 
         alert("An error has occurred."); 
      }); 
   } 
});
*/












navigator.mediaDevices.enumerateDevices().then(function(devices) 
{
	devices.forEach(function(device) 
	{			
		if(device.kind === "audioinput")
		{
			
			if(device.label.includes("USB"))
			{
				console.log("Potential audio: " + device.deviceId + " " + device.label);
				myAudioDevice = device;
			}
		}
	});
})