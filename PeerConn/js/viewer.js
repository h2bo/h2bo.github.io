var connection = new WebSocket('wss://obscure-sierra-55073.herokuapp.com'); //NECESSARY.  This is my custom signal server
//var name = ""; 
var streamerName = "";
var researcherName = "";
 
var loginButton = document.querySelector('#loginButton'); 
var videoPage = document.querySelector('#videoPage');
var connectStatus = document.querySelector('#connectStatus');
var statusText = document.querySelector('#status');
var primaryVid = document.querySelector('#primaryVid');
var prevVideo = document.querySelector('#prevVideo');
var nextVideo = document.querySelector('#nextVideo');

var connectedUser, myConnection, theStream;
var myResearcherConnection;

var qtyReceivedTracks = 0;
var receivedVideoTracks = [];
var receivedAudioTrack;
var currentPlayingVideo = 0;
var ms = new MediaStream;
var myAudioDevice;

var gotAudio = false;
//get the viewer's mic, so they can chat with the streamer
navigator.mediaDevices.enumerateDevices().then(function(devices) 
{
	devices.forEach(function(device) 
	{			
		if(device.kind === "audioinput")
		{
			if(!gotAudio)
			{
				console.log("Potential audio: " + device.deviceId + " " + device.label);
				myAudioDevice = device;
				gotAudio = true;
			}
		}
	});
})


const proxy = new URLSearchParams(window.location.search);
	
var viewerName = proxy.get('vid');
var streamerName = proxy.get('sid');
var researcherName = proxy.get('rid');


loginButton.addEventListener("click", function()
{
	DoViewerLogin();
	loginButton.disabled = true;
});


//TODO: instead of swapping through tracks,
//need to tell the Streamer to swap tracks.
nextVideo.addEventListener("click", function()
{
	console.log("Next clicked");
	send({ 
		type: "goForward"
	}, streamerName); 
	/*
	var allVidTracks = ms.getVideoTracks();	
	ms.removeTrack(allVidTracks[0]);
	
	currentPlayingVideo++;
	if(currentPlayingVideo >= qtyReceivedTracks)
		currentPlayingVideo = 0;
	
	ms.addTrack(receivedVideoTracks[currentPlayingVideo]);
	*/
});

prevVideo.addEventListener("click", function()
{
	console.log("Back clicked");
	send({ type: "goBack"},streamerName);
	
	/*
	var allVidTracks = ms.getVideoTracks();	
	ms.removeTrack(allVidTracks[0]);
	
	currentPlayingVideo--;
	if(currentPlayingVideo < 0)
		currentPlayingVideo = (qtyReceivedTracks - 1);
	
	ms.addTrack(receivedVideoTracks[currentPlayingVideo]);
	*/
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
		myResearcherConnection = new RTCPeerConnection(configuration);
		
		myConnection.addEventListener("track", e => receiveVideo(e), false);
		//myConnection.ontrack = (e) => receiveVideo(e);

         // Setup ice handling 
        myConnection.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }, streamerName); 
            } 
         };
		 
        myResearcherConnection.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }, researcherName); 
            } 
         };
		 
		const audioStream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: {exact: myAudioDevice.deviceId}}});
		for(const track of audioStream.getTracks())
		{
			myConnection.addTrack(track);
			myResearcherConnection.addTrack(track);
		}
		
		
		TryCall();
   } 
};



var keepCallingResearcher = true;

//continual Call until pickup
function TryCall()
{
	setTimeout(function()
	{
		if(keepCallingResearcher)
		{
			MyLog("Calling researcher.....");
			DoOneResearcherCall();
		}
		
		TryCall();
		
	}, 2000);
}


function DoOneResearcherCall()
{
	//myConnection.createOffer(function (offer) {
	myResearcherConnection.createOffer(function (offer) {
		send({
			type: "offer",
			offer: offer
		}, researcherName);
		
	myResearcherConnection.setLocalDescription(offer);
	//myConnection.setLocalDescription(offer); 
	
	}, function (error) {alert("An error has occurred.");});
}



function onAnswer(answer, otherName) { 

	MyLog(otherName + " " + researcherName);
	if(otherName === researcherName)
	{
		MyLog("Giggity");
		myResearcherConnection.setRemoteDescription(new RTCSessionDescription(answer));
		keepCallingResearcher = false;
	}
	
	MyLog("Got an Answer from " + otherName);
	
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
			onAnswer(data.answer, data.name); 
			break; 
		case "candidate": 
			onCandidate(data.candidate, data.name); 
			break; 
			
		case "leave":
			onLeave();
			break;
		default: 
			break; 
		}
   }
   catch(error){
	   //console.log("Got something not JSON");
   };
};  


function onLeave()
{
	console.log("Somebody left!!");
}


  
connection.onopen = function () { 
   console.log("Connected to the signalling server"); 
   statusText.innerHTML = "Connected to the signalling server!";
   loginButton.disabled = false;
};

connection.onerror = function (err) { 
   console.log("Got error", err); 
};

connection.onclose = function (e) {
	console.log("CLOSED");
	console.log(e);
	console.log("CLOSED COMPLETE");
};

// Alias for sending messages in JSON format 
function send(message, otherName) { 

   if (otherName) { 
      message.name = otherName; 
   } 
	
   connection.send(JSON.stringify(message)); 
};

//when somebody wants to call us 
function onOffer(offer, name) 
{ 
   connectedUser = name; 
   myConnection.setRemoteDescription(new RTCSessionDescription(offer));
	
   myConnection.createAnswer(function (answer) { 
      myConnection.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }, connectedUser); 
		
   }, function (error) {
      alert("oops...error"); 
   }); 
   
   console.log("Got an Offer from " + name);
}

//when another user answers to our offer 
//function onAnswer(answer, name) { 
   //myResearcherConnection.setRemoteDescription(new RTCSessionDescription(answer)); 
   //console.log("Got an Answer from " + name);
//}

//when we got ice candidate from another user 
function onCandidate(candidate, name) {
	

	if(otherName === streamerName)
	{
		myConnection.addIceCandidate(new RTCIceCandidate(candidate));
	}
	else
	{
		myResearcherConnection.addIceCandidate(new RTCIceCandidate(candidate));
	}
	//myConnections[otherName].addIceCandidate(new RTCIceCandidate(candidate));
	//myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
	MyLog("Got an ICE Candidate from " + otherName);
}



function DoViewerLogin()
{

	
   if(viewerName.length > 0){ 
      send({ 
         type: "login", 
         name: viewerName 
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


function MyLog(message)
{
	console.log(message);
	statusText.innerHTML += ("<br/>" + message);
}