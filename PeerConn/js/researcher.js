var connection = new WebSocket('wss://obscure-sierra-55073.herokuapp.com'); //NECESSARY.  This is my custom signal server
var name = ""; 

var statusText = document.querySelector('#status');
var primaryVid = document.querySelector('#primaryVid');
var saveButton = document.querySelector('#saveButton');

var connectedUser, myConnection, theStream;

var qtyReceivedTracks = 0;
var receivedVideoTracks = [];
var receivedAudioTrack;
var currentPlayingVideo = 0;
var ms;

let mediaRecorder;
let recordedBlobs;

function initPrimaryVideo()
{
	
	
	try{
		console.log("Adding vidya");
		ms.addTrack(receivedVideoTracks[0]);
		console.log("Adding audya");
		ms.addTrack(receivedAudioTrack);
		console.log("Got thru the stuff");
	
		primaryVid.srcObject = ms;
		primaryVid.play();
	}
	catch(e){
		console.log(e);
	}
}




function startRecording() {
  recordedBlobs = [];
    const possibleTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/mp4;codecs=h264,aac',
  ];
  const mimeType = 'video/webm;codecs=h264,opus';
  console.log("MIME Type: " + mimeType);
  const options = {mimeType};

  try {
    mediaRecorder = new MediaRecorder(ms, options); //may need to change window.stream to "ms"
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  
    mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
  };
  
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);
}

function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}



stopButton.addEventListener("click", e=> stopRecording(), false);

function stopRecording()
{
	console.log("Stopped recording");
	
	mediaRecorder.stop();
}



saveButton.addEventListener("click", e => saveVideoNow(), false);

function saveVideoNow()
{
	console.log("Save Button was clicked");
	//mediaRecorder.stop();
	
	const blob = new Blob(recordedBlobs, {type: 'video/webm'});
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.download = 'test.webm';
	document.body.appendChild(a);
	a.click();
	setTimeout(() => {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 100);
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
	startRecording();
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
		
		ms = new MediaStream();
		
		myConnection.addEventListener("track", e => receiveVideo(e), false);

         // Setup ice handling 
         myConnection.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         };
		 
		//const audioStream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: {exact: myAudioDevice.deviceId}}});
		//for(const track of audioStream.getTracks())
		//{
			//myConnection.addTrack(track);
		//}
		
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
			onAnswer(data.answer, data.name); 
			break; 
		case "candidate": 
			onCandidate(data.candidate, data.name); 
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
   DoResearcherLogin();
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
function onAnswer(answer, name) { 
   myConnection.setRemoteDescription(new RTCSessionDescription(answer)); 
   console.log("Got an Answer from " + name);
}

//when we got ice candidate from another user 
function onCandidate(candidate, name) { 
   myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
   console.log("Got an ICE Candidate from " + name);
}

function DoResearcherLogin()
{
	const proxy = new URLSearchParams(window.location.search);
	name = proxy.get('rid');
	
   if(name.length > 0){ 
      send({ 
         type: "login", 
         name: name 
      }); 
   }
   
   console.log("Now waiting for video stream");
   statusText.innerHTML = "Connected to the signalling server, and waiting for a stream.  Please wait....";
}