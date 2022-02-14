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

var gotAudio = false;

	navigator.mediaDevices.enumerateDevices().then(function(devices) 
	{
		devices.forEach(function(device) 
		{
			if(device.kind === "videoinput")
			{
				if(device.label.includes("USB"))
				{
				MyLog("Awesome thingy: " + device.label);
				myStreamingDevices[deviceCounter] = device.deviceId;
				deviceCounter++;
				}
			}
			else if(device.kind === "audioinput")
			{
				if(!gotAudio)
				{
					myAudioDevice = device;
					gotAudio = true;
					MyLog("Got an audio");
					MyLog(device);
					console.log(device);
				}
			}
		
			//console.log(device);
		});
	})


/*
function TryUSB()
{
	
		
	navigator.usb.requestDevice({filters:[]}).then(function(device){
		console.log(device);
	});
	
	
	navigator.usb.getDevices().then(devices =>
{
	MyLog("Button pressed");
	try
	{
	MyLog("Trying to get USB devices");
	MyLog(devices.length);
	devices.forEach(device => 
	{
		MyLog("USB Thing: " + device.productName + " " + device.serialNumber);
	})
	}
	catch(e)
	{
		MyLog(e);
	}
})
	
}
*/




var myConnections = [];
var viewerUser;
var researcherUser;
var keepCallingViewer = true;
var keepCallingResearcher = true;


function onAnswer(answer, otherName) { 

	if(otherName === viewerUser)
	{
		MyLog("Giggity");
		myConnections[0].setRemoteDescription(new RTCSessionDescription(answer));
		keepCallingViewer = false;
	}
	else
	{
		MyLog("Researcher?");
		myConnections[1].setRemoteDescription(new RTCSessionDescription(answer));
		keepCallingResearcher = false;
	}

	//myConnections[otherName].setRemoteDescription(new RTCSessionDescription(answer));
	//myConnection.setRemoteDescription(new RTCSessionDescription(answer));
	MyLog("Got an Answer from " + otherName);
	
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
	MyLog("Got an ICE Candidate from " + otherName);
}

connection.onerror = function (err) { 
   MyLog("Got error", err); 
};
  
connection.onopen = function () { 
   MyLog("Connected to the signalling server!");
   setTimeout(function(){DoLogin()}, 2000);
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
	   MyLog("<br/>Checkpoint 1");
		MyLog("logging in now");
		const proxy = new URLSearchParams(window.location.search);
		viewerUser = proxy.get('vid');
		researcherUser = proxy.get('rid');
		
		MyLog(viewerUser + " is the viewer");
		
		
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
		
		MyLog("<br/>Checkpoint 2");
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
		
		MyLog("<br/>Checkpoint 3");
		
		MyLog("Dude 1");
	const audioStream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: {exact: myAudioDevice.deviceId}}});
	MyLog("Dude 2");
	MyLog(audioStream);
	
	var theAudioTrack = audioStream.getTracks()[0];
	
	
	
	MyLog("Adding audio to the connections now");
	myConnections[0].addTrack(theAudioTrack);
	myConnections[1].addTrack(theAudioTrack);
	
	
	MyLog("<br/>Checkpoint 4");
		

	for(let i = 0; i < myStreamingDevices.length; i++)
	{
		var vidyaID = "video"+i;
		 MyLog("Vidya id: " + vidyaID);
	}
	
	MyLog("<br/>Checkpoint 4.2");
	
	MyLog("<br/>Quantity of devices: " + myStreamingDevices.length);
	
	
	MyLog("Quantity of peer connections: " + myConnections.length);
	for(let i = 0; i < myStreamingDevices.length; i++)
	{
		try{
		MyLog("Trying to setup vidya");
		 //getting local video stream 
		 const gumStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: myStreamingDevices[i]}}});
		 
		 var vidyaID = "video"+i;
		 //document.querySelector('#'+vidyaID).srcObject = gumStream;
		 
		 MyLog("Here is a track");
		 myStreamingTracks[i] = gumStream.getTracks()[0];
		 
		 MyLog("Track is: " + myStreamingTracks[i].label);
		 
		 //for(const track of gumStream.getTracks())
		 //{
			 
			 //myConnection.addTrack(track);
			 
		 //}
		}
		catch(e)
		{
			MyLog(e);
		}
	}
	
	MyLog("<br/>Checkpoint 5");
	
	//for(let awesomeConnection of myConnections)
	//{
		//console.log("Adding video track");
		//awesomeConnection.addTrack(myStreamingTracks[currentStreamingTrackNum]);
	//}
	
	theViewerSender = myConnections[0].addTrack(myStreamingTracks[currentStreamingTrackNum]);
	theResearcherSender = myConnections[1].addTrack(myStreamingTracks[currentStreamingTrackNum]);
	
	

	//for(let awesomeConnection of myConnections)
	//{
		//console.log("Adding audio track giggity");
		//awesomeConnection.addTrack(audioStream.getTracks()[0]);
	//}
	
	MyLog("Connected and streaming " + myStreamingDevices.length + " devices.<br/>Keep this page up and running.");
	

	MyLog("<br/>Checkpoint 6");
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
			MyLog("Calling viewer....");
			DoOneViewerCall();
		}
		
		if(keepCallingResearcher)
		{
			MyLog("Calling researcher.....");
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


function MyLog(message)
{
	console.log(message);
	statusText.innerHTML += ("<br/>" + message);
}