//NECESSARY.  This is my custom signal server
var connection = new WebSocket('wss://obscure-sierra-55073.herokuapp.com');

//document selector for the status text.
var statusText = document.querySelector('#status');

var connectedUser;

var name = "";

///////////////////////////////////////////////////////////////
//Collect all of the streaming cameras that are found.
//This doesn't get the media; it just checks what is connected.
///////////////////////////////////////////////////////////////
var myStreamingDevices = [];
var currentStreamingTrackNum = 0;
var myStreamingTracks = [];
var deviceCounter = 0;
var myAudioDevice;
var theViewerSender;
var theResearcherSender;

navigator.mediaDevices.enumerateDevices().then(function(devices) 
{
	devices.forEach(function(device) 
	{
		if(device.kind === "videoinput")
		{
			myStreamingDevices[deviceCounter] = device.deviceId;
			deviceCounter++;
		}
		else if(device.kind === "audioinput")
		{
			myAudioDevice = device;
		}
	});
})

var myConnections = [];
var viewerUser;
var researcherUser;
var keepCallingViewer = true;
var keepCallingResearcher = true;


function onAnswer(answer, otherName) { 

	if(otherName === viewerUser)
	{
		console.log("Giggity");
		myConnections[0].setRemoteDescription(new RTCSessionDescription(answer));
		keepCallingViewer = false;
	}
	else
	{
		console.log("Researcher?");
		myConnections[1].setRemoteDescription(new RTCSessionDescription(answer));
		keepCallingResearcher = false;
	}

	//myConnections[otherName].setRemoteDescription(new RTCSessionDescription(answer));
	//myConnection.setRemoteDescription(new RTCSessionDescription(answer));
	console.log("Got an Answer from " + otherName);
	
}

function onCandidate(candidate, otherName) {
	
	if(otherName === viewerUser)
	{
		myConnections[0].addIceCandidate(new RTCIceCandidate(candidate));
	}
	else
	{
		myConnections[1].addIceCandidate(new RTCIceCandidate(candidate));
	}
	//myConnections[otherName].addIceCandidate(new RTCIceCandidate(candidate));
	//myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
	console.log("Got an ICE Candidate from " + otherName);
}

connection.onerror = function (err) { 
   console.log("Got error", err); 
};
  
connection.onopen = function () { 
   console.log("Connected to the signalling server"); 
   statusText.innerHTML = "Connected to the signalling server!";
   DoLogin();
};

function DoLogin(){
	
	const proxy = new URLSearchParams(window.location.search);
	
	name = proxy.get('sid');	
	if(name.length > 0){
      send({ 
         type: "login", 
         name: name 
      }); 
	}
}

//handle messages from the server 
connection.onmessage = function (message) {   
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
		case "goBack":
			onGoBack();
			break;
		case "goForward":
			onGoForward();
			break;
		default: 
			break; 
		}
   }
   catch(error){
	   
   };
};

//when a user logs in 
async function onLogin(success) { 

   if (success === false) { 
      alert("oops...try a different username"); 
   } 
   
   else 
   {
		const proxy = new URLSearchParams(window.location.search);
		viewerUser = proxy.get('vid');
		researcherUser = proxy.get('rid');
		
		console.log(viewerUser + " is the viewer");
		
		
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
		
		
		//myConnection = new RTCPeerConnection(configuration);
		//myConnection.addEventListener("track", e => receiveAudio(e), false);
		myConnections[0] = new RTCPeerConnection(configuration);
		myConnections[0].addEventListener("track", e=> receiveAudio(e), false);
		
		myConnections[1] = new RTCPeerConnection(configuration);
		//do not need researcher audio, so skip
		
		
		myConnections[0].onicecandidate = function(event){
			if(event.candidate){
				send({
					type: "candidate",
					candidate: event.candidate
				},
				viewerUser);
			}
		};
		myConnections[1].onicecandidate = function(event){
			if(event.candidate){
				send({
					type: "candidate",
					candidate: event.candidate
				},
				researcherUser);
			}
		};		
        /*
         myConnection.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({
                  type: "candidate", 
                  candidate: event.candidate
               });
            } 
         }; 
		*/

	for(let i = 0; i < myStreamingDevices.length; i++)
	{
		var vidyaID = "video"+i;
		 console.log("Vidya id: " + vidyaID);
	}
	console.log("Quantity of peer connections: " + myConnections.length);
	for(let i = 0; i < myStreamingDevices.length; i++)
	{
		console.log("Trying to setup vidya");
		 //getting local video stream 
		 const gumStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: myStreamingDevices[i]}}});
		 
		 var vidyaID = "video"+i;
		 //document.querySelector('#'+vidyaID).srcObject = gumStream;
		 
		 console.log("Here is a track");
		 myStreamingTracks[i] = gumStream.getTracks()[0];
		 
		 //for(const track of gumStream.getTracks())
		 //{
			 
			 //myConnection.addTrack(track);
			 
		 //}
	}
	
	//for(let awesomeConnection of myConnections)
	//{
		//console.log("Adding video track");
		//awesomeConnection.addTrack(myStreamingTracks[currentStreamingTrackNum]);
	//}
	
	theViewerSender = myConnections[0].addTrack(myStreamingTracks[currentStreamingTrackNum]);
	theResearcherSender = myConnections[1].addTrack(myStreamingTracks[currentStreamingTrackNum]);
	
	const audioStream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: {exact: myAudioDevice.deviceId}}});
	
	for(let awesomeConnection of myConnections)
	{
		console.log("Adding audio track giggity");
		awesomeConnection.addTrack(audioStream.getTracks()[0]);
	}
	
	statusText.innerHTML = "Connected and streaming " + myStreamingDevices.length + " devices.<br/>Keep this page up and running.";
	

	
	TryCall();
   } 
};

//continual Call until pickup
function TryCall()
{
	setTimeout(function()
	{
		if(keepCallingViewer)
		{
			console.log("Calling viewer....");
			DoOneViewerCall();
		}
		
		if(keepCallingResearcher)
		{
			console.log("Calling researcher.....");
			DoOneResearcherCall();
		}
		
		if(keepCallingViewer || keepCallingResearcher)
			TryCall();
		
	}, 2000);
	
}

function DoOneResearcherCall()
{
	//myConnection.createOffer(function (offer) {
	myConnections[1].createOffer(function (offer) {
		send({
			type: "offer",
			offer: offer
		}, researcherUser);
		
	myConnections[1].setLocalDescription(offer);
	//myConnection.setLocalDescription(offer); 
	
	}, function (error) {alert("An error has occurred.");});
}

function DoOneViewerCall()
{
	//myConnection.createOffer(function (offer) {
	myConnections[0].createOffer(function (offer) {
		send({
			type: "offer",
			offer: offer
		}, viewerUser);
		
	myConnections[0].setLocalDescription(offer);
	//myConnection.setLocalDescription(offer); 
	
	}, function (error) {alert("An error has occurred.");});
}

function receiveAudio(e)
{	
	var ms = new MediaStream();
	ms.addTrack(e.track);
	
	document.querySelector('#viewerAudio').srcObject = ms;
	document.querySelector('#viewerAudio').play();
}




function onGoBack()
{
	currentStreamingTrackNum--;
	if(currentStreamingTrackNum < 0)
		currentStreamingTrackNum = myStreamingTracks.length - 1;
	
	theViewerSender.replaceTrack(myStreamingTracks[currentStreamingTrackNum]);
	theResearcherSender.replaceTrack(myStreamingTracks[currentStreamingTrackNum]);
}

function onGoForward()
{
	currentStreamingTrackNum++;
	if(currentStreamingTrackNum > myStreamingTracks.length - 1)
		currentStreamingTrackNum = 0;
	
	theViewerSender.replaceTrack(myStreamingTracks[currentStreamingTrackNum]);
	theResearcherSender.replaceTrack(myStreamingTracks[currentStreamingTrackNum]);
}






// Alias for sending messages in JSON format 
function send(message, otherName) { 
///////////this function needs to change, to know who we are messaging
   if (otherName) { 
      message.name = otherName; 
   } 
	
   connection.send(JSON.stringify(message)); 
};



























//when somebody wants to call us 
//does this get fired in my implementation?
//i do not think i need this - the Streamer is doing the calling, always
/*
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
*/