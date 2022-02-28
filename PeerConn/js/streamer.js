//NECESSARY.  This is my custom signal server
var connection = new WebSocket('wss://obscure-sierra-55073.herokuapp.com');

//document selector for the status text.
var statusText = document.querySelector('#status');
var vidConfigPage = document.querySelector('#vidConfigPage');
var streamingPage = document.querySelector('#streamingPage');

var controllerName;

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
var theViewerAudioSender;
var theResearcherSender;
var theResearcherAudioSender;

var prevTrack;

var frontTrack;
var behindTrack;
var leftTrack;
var rightTrack;

var gotAudio = false;
var isMuted = false;

	navigator.mediaDevices.enumerateDevices().then(function(devices) 
	{
		devices.forEach(function(device) 
		{
			if(device.kind === "videoinput")
			{
				if(device.label.includes("USB") || device.label.includes("C270"))
				{
				MyLog("Awesome thingy: " + device.label);
				myStreamingDevices[deviceCounter] = device.deviceId;
				deviceCounter++;
				}
			}
			else if(device.kind === "audioinput")
			{
				MyLog("Audio:" + device.deviceId);
				MyLog(device);
				if(device.deviceId.includes("comm")) //this needs to be changed; needs to be whatever the bluetooth shit is
				if(!gotAudio)
				{
					myAudioDevice = device;
					gotAudio = true;
					MyLog("Got an audio");
					MyLog(device);
				}
			}
		
			//console.log(device);
		});
	})
	
	
	
	
	
	
	
	
	
	
	
	
	

var startButton = document.querySelector('#startVideos');
var vid0Options = document.querySelector('#vid0Options');
var vid1Options = document.querySelector('#vid1Options');
var vid2Options = document.querySelector('#vid2Options');
var vid3Options = document.querySelector('#vid3Options');
var saveButton = document.querySelector('#saveButton');
var mySortedTracks = [];	
	
startButton.addEventListener("click", ShowCams);
saveButton.addEventListener("click", SaveConfig);
	
async function ShowCams()
{
	for(var i = 0; i < myStreamingDevices.length; i++)
	{
		var selector = "#vid" + i;
		console.log(selector);
		var currVid = document.querySelector(selector);
		
		var gumStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: myStreamingDevices[i]}}}).then(function(stream){
			
			currVid.srcObject = stream;
			currVid.play();
		});		
	}
}

function SaveConfig()
{
	var a = vid0Options.value;
	var b = vid1Options.value;
	var c = vid2Options.value;
	var d = vid3Options.value;
	
	if(a === b || a === c || a === d || b === c || b === d || c === d)
	{
		alert("Duplicate video mapping");
		return;
	}

	mySortedTracks[a] = myStreamingDevices[0];
	mySortedTracks[b] = myStreamingDevices[1];
	mySortedTracks[c] = myStreamingDevices[2];
	mySortedTracks[d] = myStreamingDevices[3];
	
	console.log("front: " + mySortedTracks[0]); //front
	console.log("behind: " + mySortedTracks[1]); //behind
	console.log("left: " + mySortedTracks[2]); //left
	console.log("right: " + mySortedTracks[3]);	//right
	
	frontTrack = mySortedTracks[0];
	behindTrack = mySortedTracks[1];
	leftTrack = mySortedTracks[2];
	rightTrack = mySortedTracks[3];
	
	document.querySelector('#vid0').srcObject = null;
	document.querySelector('#vid1').srcObject = null;
	document.querySelector('#vid2').srcObject = null;
	document.querySelector('#vid3').srcObject = null;
	
	vidConfigPage.style.display = "none";
	streamingPage.style.display = "inline";
	
	DoLogin();
}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	


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
   //setTimeout(function(){DoLogin()}, 2000); //used if we want to auto-login...
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
		case "mute":
			onMute();
			break;
		case "resume":
			onResume();
			break;
		case "front":
			onFront();
			break;
		case "behind":
			onBehind();
			break;
		case "left":
			onLeft();
			break;
		case "right":
			onRight();
			break;
		case "leave":
			onLeave(data.name);
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
		controllerName = proxy.get('cid');
		
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
	theViewerAudioSender = myConnections[0].addTrack(theAudioTrack);
	theResearcherAudioSender = myConnections[1].addTrack(theAudioTrack);
	
	
	MyLog("<br/>Checkpoint 4");
	
	MyLog("<br/>Quantity of devices: " + myStreamingDevices.length);
	MyLog("Quantity of peer connections: " + myConnections.length);
	
	
	try{
		
		MyLog("Collecting sorted tracks");
		
		const frontStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: mySortedTracks[0]}}});
		frontTrack = frontStream.getTracks()[0];
		
		const behindStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: mySortedTracks[1]}}});
		behindTrack = behindStream.getTracks()[0];
		
		const leftStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: mySortedTracks[2]}}});
		leftTrack = leftStream.getTracks()[0];
		
		const rightStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: mySortedTracks[3]}}});
		rightTrack = rightStream.getTracks()[0];
		
		MyLog("Sorted Track Collection Complete");
	}
	catch(e)
	{
		MyLog(e);
	}
	
	
	
	
	/*
	
	for(let i = 0; i < myStreamingDevices.length; i++)
	{
		try{
		MyLog("Trying to setup vidya");
		 //getting local video stream 
		 const gumStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: myStreamingDevices[i]}}});
		 
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
	*/
	
	MyLog("<br/>Checkpoint 5");
	
	//for(let awesomeConnection of myConnections)
	//{
		//console.log("Adding video track");
		//awesomeConnection.addTrack(myStreamingTracks[currentStreamingTrackNum]);
	//}
	
	theViewerSender = myConnections[0].addTrack(behindTrack);
	theResearcherSender = myConnections[1].addTrack(behindTrack);
	
	
	/*
	theViewerSender = myConnections[0].addTrack(myStreamingTracks[currentStreamingTrackNum]);
	theResearcherSender = myConnections[1].addTrack(myStreamingTracks[currentStreamingTrackNum]);
	*/
	

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
			console.log("Calling viewer....");
			DoOneViewerCall();
		}
		
		if(keepCallingResearcher)
		{
			console.log("Calling researcher.....");
			DoOneResearcherCall();
		}
		
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


function onMute()
{
	//need a way to stop streaming to both researcher and viewer... 
	//perhaps replace track with null?
	
	MyLog("Received a Mute");
	
	theViewerSender.replaceTrack(null);
	theResearcherSender.replaceTrack(null);
	
	isMuted = true;
}

function onResume()
{
	MyLog("Received a Resume");
	theViewerSender.replaceTrack(prevTrack);
	theResearcherSender.replaceTrack(prevTrack);
	
	isMuted = false;
}

function onFront()
{
	if(isMuted)
		return;
	
	MyLog("Received a Front");
	theViewerSender.replaceTrack(frontTrack);
	theResearcherSender.replaceTrack(frontTrack);
	prevTrack = frontTrack;
}

function onBehind()
{
	if(isMuted)
		return;
	
	MyLog("Received a Behind");
	theViewerSender.replaceTrack(behindTrack);
	theResearcherSender.replaceTrack(behindTrack);	
	prevTrack = behindTrack;
}

function onLeft()
{
	if(isMuted)
		return;
	
	MyLog("Received a Left");
	theViewerSender.replaceTrack(leftTrack);
	theResearcherSender.replaceTrack(leftTrack);
	prevTrack = leftTrack;
}

function onRight()
{
	if(isMuted)
		return;
	
	MyLog("Received a Right");
	theViewerSender.replaceTrack(rightTrack);
	theResearcherSender.replaceTrack(rightTrack);	
	prevTrack = rightTrack;
}

function onLeave(name)
{
	MyLog("Somebody left :( :" + name);
	
	if(name.includes("dude") || name === "dude")
	{
		keepCallingResearcher = true;
	}
	else if (name.includes("scooby") || name === "scooby")
	{
		keepCallingViewer = true;
	}
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